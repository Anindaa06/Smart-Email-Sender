export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const sendInBatches = async ({ recipients, mailOptionsBuilder, transporter, preferences, onProgress }) => {
  const batchSize = Number(preferences?.batchSize) || 10
  const delayBetweenBatches = Number(preferences?.delayBetweenBatches) || 1000

  const chunks = []
  for (let index = 0; index < recipients.length; index += batchSize) {
    chunks.push(recipients.slice(index, index + batchSize))
  }

  const flatResults = []

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const chunk = chunks[chunkIndex]

    const results = await Promise.allSettled(
      chunk.map((recipient) => transporter.sendMail(mailOptionsBuilder(recipient))),
    )

    const mapped = results.map((result, idx) => ({ result, recipient: chunk[idx] }))
    flatResults.push(...mapped)

    if (onProgress) {
      onProgress({
        chunkIndex: chunkIndex + 1,
        totalChunks: chunks.length,
        chunkSize: chunk.length,
        processedInChunk: chunk.length,
      })
    }

    // For high-volume production use, integrate a dedicated email service (SendGrid, Resend) with built-in rate limiting instead of manual delays.
    if (chunkIndex < chunks.length - 1) {
      await sleep(delayBetweenBatches)
    }
  }

  return flatResults
}
