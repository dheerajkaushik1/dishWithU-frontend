import { request } from "./api";

export const authApi = {
  register: (values) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(values) }),
  login: (values) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(values) }),
  profile: (token) => request('/api/auth/profile', { token }),
}
