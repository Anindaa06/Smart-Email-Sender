import path from 'path'
import XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const normalizeRow = (row) => {
  const next = {}
  Object.entries(row || {}).forEach(([key, value]) => {
    if (typeof value === 'string') {
      next[key.trim()] = value.trim()
      return
    }
    next[key] = value
  })
  return next
}

export const parseRecipientsFromFile = async (buffer, originalname) => {
  const ext = path.extname(originalname || '').toLowerCase()
  let rows = []

  if (ext === '.csv') {
    const text = buffer.toString('utf8')
    rows = parse(text, { columns: true, skip_empty_lines: true, trim: true })
  } else if (ext === '.xlsx') {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
  } else {
    throw new Error('Only CSV and Excel files are supported')
  }

  const valid = []
  const invalid = []

  rows.forEach((row, index) => {
    const normalized = normalizeRow(row)
    const emailValue = String(normalized.email || normalized.Email || '').trim().toLowerCase()

    if (!emailValue) {
      invalid.push({ rowNumber: index + 2, reason: 'Missing email', data: normalized })
      return
    }

    if (!isValidEmail(emailValue)) {
      invalid.push({ rowNumber: index + 2, reason: 'Invalid email format', data: normalized })
      return
    }

    valid.push({
      ...normalized,
      email: emailValue,
      name: normalized.name || normalized.Name || '',
      company: normalized.company || normalized.Company || '',
    })
  })

  return {
    valid,
    invalid,
    totalRows: rows.length,
    validCount: valid.length,
    invalidCount: invalid.length,
  }
}
