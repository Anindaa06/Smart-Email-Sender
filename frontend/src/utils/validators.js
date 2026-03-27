export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
export const isValidPassword = (pass) => pass.length >= 8
export const isNonEmpty = (val) => val.trim().length > 0
