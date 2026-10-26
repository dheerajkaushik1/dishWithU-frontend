import { request } from "./api";

export const roomApi = {
  create: (token, password) => request('/api/rooms/create', { token, method: 'POST', body: JSON.stringify({ password }) }),
  join: (token, roomId, password) => request('/api/rooms/join', { token, method: 'POST', body: JSON.stringify({ roomId, password }) }),
  get: (token, roomId) => request(`/api/rooms/${encodeURIComponent(roomId)}`, { token }),
  close: (token, roomId) => request(`/api/rooms/${encodeURIComponent(roomId)}/close`, { token, method: 'POST' }),
  updateTheme: (token, roomId, theme) => request(`/api/rooms/${encodeURIComponent(roomId)}/theme`, { token, method: 'PATCH', body: JSON.stringify({ theme }) }),
}
