import { API_BASE } from '../config'

// Minimal fetch wrapper to centralize API calls and headers.
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch (err) {
    data = text
  }

  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'API Error')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export default { apiFetch }
