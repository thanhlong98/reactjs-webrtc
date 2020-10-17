const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const socket = require('socket.io')
const io = socket(server)

// {
//   "roomID": [
//     'socketID1',
//     'socketID2',
//     'socketID3',
//     'socketID4',
//   ]
// }
const rooms = {}
const users = {}

const connectedPeers = new Map()

io.on('connection', (socket) => {
  socket.on('join', (roomId) => {
    const roomClients = io.sockets.adapter.rooms[roomId] || { length: 0 }
    const numberOfClients = roomClients.length

    rooms[roomId] = rooms[roomId] ? [...rooms[roomId], socket.id] : [socket.id]
    users[socket.id] = roomId
    // These events are emitted only to the sender socket.

    if (numberOfClients == 0) {
      socket.join(roomId)
    } else if (numberOfClients <= 10) {
      socket.join(roomId)

      const otherUsers = rooms[roomId].filter((id) => id !== socket.id)

      // Gửi tất cả user trong room ngoại trừ sender
      socket.broadcast.to(roomId).emit('new_user', socket.id)

      // Chỉ gửi cho sender
      socket.emit('list_user', otherUsers)
    } else {
      socket.emit('full_room', roomId)
    }
  })

  socket.on('disconnect', () => {
    const roomId = users[socket.id]
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id)
      delete users[socket.id]
      socket.broadcast.to(roomId).emit('peer_disconnected', socket.id)
    }
  })

  socket.on('sending_signal', (payload) => {
    io.to(payload.userToSignal).emit('user_joind')
  })

  // socket.on('start_call', (roomId) => {
  //   socket.broadcast.to(roomId).emit('call')
  // })

  // socket.on('offer', (payload) => {
  //   socket.broadcast.to(payload.roomId).emit('offer', payload)
  // })

  // socket.on('answer', (payload) => {
  //   socket.broadcast.to(payload.roomId).emit('answer', payload)
  // })

  // socket.on('ice-candidate', (incoming) => {
  //   socket.broadcast
  //     .to(incoming.roomId)
  //     .emit('ice-candidate', incoming.candidate)
  // })
})

server.listen(process.env.PORT || 8000, () =>
  console.log('server is running on port 8000')
)
