export const errorHandler = (err, req, res, next) => {
  console.error(err)
  const status = err.statusCode || res.statusCode || 500
  res.status(status >= 400 ? status : 500).json({
    message: err.message || 'Server Error',
  })
}
