import multer from 'multer'
import path from 'path'

const storage = multer.memoryStorage()

const allowedMimeTypes = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const uploadFile = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const validExtension = ext === '.csv' || ext === '.xlsx'
    const validMime = allowedMimeTypes.has(file.mimetype)

    if (!validExtension || !validMime) {
      return cb(new Error('Only CSV and Excel files are supported'))
    }

    return cb(null, true)
  },
})

export { uploadFile }
