import EmailLog from '../models/EmailLog.js'

export const calculateBackoffDelay = (attemptNumber) => {
  if (attemptNumber >= 5) return null
  return Math.min(30 * Math.pow(2, attemptNumber - 1), 900)
}

export const scheduleRetry = async (emailLogId, recipientEmail, attemptNumber) => {
  const delaySeconds = calculateBackoffDelay(attemptNumber)

  if (delaySeconds === null) {
    await EmailLog.updateOne(
      { _id: emailLogId, 'recipients.email': recipientEmail },
      {
        $set: {
          'recipients.$.status': 'failed',
          'recipients.$.nextRetryAt': null,
        },
      },
    )
    return null
  }

  const nextRetryAt = new Date(Date.now() + delaySeconds * 1000)

  await EmailLog.updateOne(
    { _id: emailLogId, 'recipients.email': recipientEmail },
    {
      $set: {
        'recipients.$.status': 'retrying',
        'recipients.$.nextRetryAt': nextRetryAt,
      },
    },
  )

  return nextRetryAt
}
