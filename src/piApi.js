/**
 * Pi Flask API (braille-hardware/app.py).
 * Base URL: localStorage senso_pi_api_base, default http://127.0.0.1:5001
 */

const STORAGE_KEY = 'senso_pi_api_base'
const DEFAULT_BASE = 'http://127.0.0.1:5001'

export function getPiBaseUrl() {
  if (typeof window !== 'undefined') {
    const u = window.localStorage.getItem(STORAGE_KEY)?.trim()
    if (u) return u.replace(/\/$/, '')
  }
  return DEFAULT_BASE
}

export function setPiBaseUrl(url) {
  if (typeof window === 'undefined') return
  const t = url?.trim()
  if (!t) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, t.replace(/\/$/, ''))
}

async function request(path, options = {}) {
  const url = `${getPiBaseUrl()}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export function fetchState() {
  return request('/state')
}

export function postPress() {
  return request('/press', { method: 'POST' })
}

export function postNext() {
  return request('/next', { method: 'POST' })
}
