import { io } from 'socket.io-client'
import { API_URL } from './api'

export function createRoomSocket(token) {
  return io(API_URL, { auth: { token }, reconnection: true, reconnectionAttempts: 8, reconnectionDelay: 800, timeout: 12000 })
}