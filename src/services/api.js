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

export const authApi = {
  register: (values) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(values) }),
  login: (values) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(values) }),
  profile: (token) => request('/api/auth/profile', { token }),
}

export const roomApi = {
  create: (token, password) => request('/api/rooms/create', { token, method: 'POST', body: JSON.stringify({ password }) }),
  join: (token, roomId, password) => request('/api/rooms/join', { token, method: 'POST', body: JSON.stringify({ roomId, password }) }),
  get: (token, roomId) => request(`/api/rooms/${encodeURIComponent(roomId)}`, { token }),
  close: (token, roomId) => request(`/api/rooms/${encodeURIComponent(roomId)}/close`, { token, method: 'POST' }),
  updateTheme: (token, roomId, theme) => request(`/api/rooms/${encodeURIComponent(roomId)}/theme`, { token, method: 'PATCH', body: JSON.stringify({ theme }) }),
}

export { API_URL }