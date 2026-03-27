import User from '../models/User.js'
import EmailLog from '../models/EmailLog.js'
import { personalizeEmail, personalizeSubject } from './personalizeEmail.js'
import { scheduleRetry } from './retryQueue.js'
import { sendInBatches } from './batchSender.js'

export const sendEmailBatch = async ({
  userId,
  recipients,
  subject,
  message,
  transporter,
  logId,
  fromAddress,
  onProgress,
  emitProgress,
}) => {
  const user = await User.findById(userId).select('sendingPreferences')
  if (!user) {
    throw new Error('User not found while sending batch')
  }

  const preferenceMaxRetries = Number(user.sendingPreferences?.maxRetriesPerEmail) || 3
  const stateByEmail = new Map(
    recipients.map((recipient) => [recipient.email, { ...recipient, status: 'pending', attempts: Number(recipient.attempts || 0) }]),
  )

  let processed = 0

  const resultRows = await sendInBatches({
    recipients,
    transporter,
    preferences: user.sendingPreferences,
    mailOptionsBuilder: (recipient) => {
      const personalizedSubject = personalizeSubject(subject, recipient)
      const personalizedMessage = personalizeEmail(message, recipient)
      return {
        from: fromAddress || recipient.email,
        to: recipient.email,
        subject: personalizedSubject,
        text: personalizedMessage,
        html: `<p>${personalizedMessage.replace(/\n/g, '<br>')}</p>`,
      }
    },
    onProgress: (progressData) => {
      processed += progressData.processedInChunk
      if (onProgress) {
        onProgress({ ...progressData, processed, total: recipients.length })
      }
      if (emitProgress) {
        emitProgress({ processed, total: recipients.length, chunkIndex: progressData.chunkIndex, totalChunks: progressData.totalChunks })
      }
    },
  })

  const now = new Date()

  for (const row of resultRows) {
    const recipient = stateByEmail.get(row.recipient.email)
    if (!recipient) continue

    recipient.attempts = Number(recipient.attempts || 0) + 1
    recipient.lastAttemptAt = now

    if (row.result.status === 'fulfilled') {
      recipient.status = 'sent'
      recipient.errorMessage = ''
      recipient.nextRetryAt = null
    } else {
      recipient.errorMessage = row.result.reason?.message || 'Send failed'
      const canRetry = recipient.attempts <= preferenceMaxRetries

      if (canRetry) {
        const retryTime = await scheduleRetry(logId, recipient.email, recipient.attempts)
        recipient.status = retryTime ? 'retrying' : 'failed'
        recipient.nextRetryAt = retryTime
      } else {
        recipient.status = 'failed'
        recipient.nextRetryAt = null
      }
    }
  }

  const recipientsWithState = [...stateByEmail.values()]
  const sent = recipientsWithState.filter((item) => item.status === 'sent').length
  const failed = recipientsWithState.filter((item) => item.status !== 'sent').length

  let status = 'success'
  if (sent === 0) status = 'failed'
  if (sent > 0 && failed > 0) status = 'partial'

  const errorDetails = recipientsWithState
    .filter((r) => r.errorMessage)
    .map((r) => `${r.email}: ${r.errorMessage}`)
    .join(' | ')

  await EmailLog.findByIdAndUpdate(logId, {
    recipients: recipientsWithState,
    sentCount: sent,
    failedCount: failed,
    status,
    errorDetails,
  })

  if (emitProgress) {
    emitProgress({ done: true, sent, failed, total: recipientsWithState.length })
  }

  return {
    sent,
    failed,
    total: recipientsWithState.length,
    results: recipientsWithState,
  }
}
