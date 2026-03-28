import Handlebars from 'handlebars'

Handlebars.registerHelper('default', (value, fallback) => value || fallback)

export const personalizeEmail = (templateString, recipientData = {}) => {
  try {
    const template = Handlebars.compile(templateString, { strict: false })
    return template(recipientData)
  } catch (err) {
    console.warn(`[TemplateEngine] Failed to personalize email: ${err.message}`)
    return templateString
  }
}

export const personalizeSubject = (subjectTemplate, recipientData = {}) => {
  try {
    const template = Handlebars.compile(subjectTemplate, { strict: false })
    return template(recipientData)
  } catch {
    return subjectTemplate
  }
}

export const extractVariables = (templateString) => {
  const regex = /\{\{(\w+)\}\}/g
  const matches = []
  let match
  while ((match = regex.exec(templateString)) !== null) {
    if (!matches.includes(match[1])) {
      matches.push(match[1])
    }
  }
  return matches
}

export const validateTemplate = (templateString, recipientData) => {
  const variables = extractVariables(templateString)
  const missing = variables.filter((v) => recipientData[v] === undefined || recipientData[v] === null)
  return {
    valid: missing.length === 0,
    missing,
    variables,
  }
}

export default {
  personalizeEmail,
  personalizeSubject,
  extractVariables,
  validateTemplate,
}
