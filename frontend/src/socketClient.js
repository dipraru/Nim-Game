import { io } from 'socket.io-client'

export function createSocket(url) {
  const socket = io(url, { autoConnect: false })
  return socket
}
