import Handlebars from 'handlebars'

const safeCompile = (templateString, recipientData) => {
  try {
    const compiled = Handlebars.compile(templateString || '', { strict: false })
    return compiled(recipientData || {})
  } catch (error) {
    return templateString || ''
  }
}

export const personalizeEmail = (templateString, recipientData) => safeCompile(templateString, recipientData)

export const personalizeSubject = (subjectTemplate, recipientData) => safeCompile(subjectTemplate, recipientData)

export const extractVariables = (templateString = '') => {
  const matches = [...templateString.matchAll(/\{\{(\w+)\}\}/g)]
  return [...new Set(matches.map((match) => match[1]))]
}
