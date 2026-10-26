const API_URL = (import.meta.env.VITE_API_URL || 'https://dishwithu.onrender.com').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status }
}

export async function request(path, { token, ...options } = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } })
  } catch { throw new ApiError('Could not reach Dish With U. Check your connection and try again.', 0) }
  const payload = await response.json().catch(() => ({}))
  if (response.status === 401 && token) window.dispatchEvent(new Event('dishwithu:expired'))
  if (!response.ok || payload.success === false) throw new ApiError(payload.message || 'Something went wrong. Please try again.', response.status)
  return payload
}

export { API_URL }