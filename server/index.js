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

io.on('connection', (socket) => {
  // socket.on('join', (roomId) => {
  //   const roomClients = io.sockets.adapter.rooms[roomId] || { length: 0 }
  //   const numberOfClients = roomClients.length

  //   if (rooms[roomId]) {
  //     rooms[roomId].push(socket.id)
  //   } else {
  //     rooms[roomId] = [socket.id]
  //   }

  //   const otherUser = rooms[roomId].filter((id) => id !== socket.id)

  //   if (otherUser) {
  //     socket.emit('other_user', otherUser)
  //     socket.broadcast.emit('user_joined', socket.id)
  //   }
  // })

  // socket.on('offer', (payload) => {
  //   io.to(payload.target).emit('offer', payload)
  // })

  socket.on('join', (roomId) => {
    const roomClients = io.sockets.adapter.rooms[roomId] || { length: 0 }
    const numberOfClients = roomClients.length

    // These events are emitted only to the sender socket.
    if (numberOfClients == 0) {
      console.log(
        `Creating room ${roomId} and emitting room_created socket event`
      )
      socket.join(roomId)
      socket.emit('room_created', roomId)
    } else if (numberOfClients <= 10) {
      console.log(
        `Joining room ${roomId} and emitting room_joined socket event`
      )
      socket.join(roomId)
      socket.emit('room_joined', roomId)
    } else {
      console.log(`Can't join room ${roomId}, emitting full_room socket event`)
      socket.emit('full_room', roomId)
    }
  })
})

server.listen(process.env.PORT || 8000, () =>
  console.log('server is running on port 8000')
)
