// Template management — stored in localStorage
const KEY = 'ping_templates'

export function getTemplates() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function saveTemplate(template) {
  const templates = getTemplates()
  const idx = templates.findIndex(t => t.id === template.id)
  if (idx >= 0) templates[idx] = template
  else templates.unshift(template)
  localStorage.setItem(KEY, JSON.stringify(templates))
  return templates
}

export function deleteTemplate(id) {
  const updated = getTemplates().filter(t => t.id !== id)
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}

export function newTemplateId() {
  return `tpl_${Date.now()}`
}

export function getDefaultTemplate() {
  return getTemplates().find(t => t.isDefault) || null
}

export function setDefaultTemplate(id) {
  const templates = getTemplates().map(t => ({ ...t, isDefault: t.id === id }))
  localStorage.setItem(KEY, JSON.stringify(templates))
  return templates
}
