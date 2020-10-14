import React, { useEffect, useRef, useState } from 'react'
import useMediaDevices from '../hooks/useMediaDevices'
import io from 'socket.io-client'
import Peer from 'simple-peer'

const Video = (props) => {
  const ref = useRef()

  useEffect(() => {
    props.peer.on('stream', (stream) => {
      ref.current.srcObject = stream
    })
  }, [])

  return <video playsInline autoPlay ref={ref} />
}

const Room = (props) => {
  const roomID = props.match.params.roomID
  const socketRef = useRef()
  const userVideo = useRef()
  const peersRef = useRef([])

  const [stream, setStream] = useState(null)
  const [users, setUsers] = useState([])
  const [peers, setPeers] = useState([])
  const { devices } = useMediaDevices()
  const [audios, setAudios] = useState([])
  const [videos, setVideos] = useState([])
  const [currentCamera, setCurrentCamera] = useState(null)
  const [currentAudio, setCurrentAudio] = useState(null)

  async function createStream(cameraId, audioId) {
    if (!cameraId && !audioId) return null

    const constraints = {
      audio: audioId
        ? {
            deviceId: audioId,
            echoCancellation: true,
          }
        : false,
      video: cameraId
        ? {
            deviceId: cameraId,
            width: { min: 1280 },
            height: { min: 720 },
          }
        : false,
    }

    return await navigator.mediaDevices.getUserMedia(constraints)
  }

  useEffect(() => {
    socketRef.current = io.connect('/')
    socketRef.current.emit('join', roomID)
    socketRef.current.on('other_user', (data) => {
      setUsers([...data])
    })
    socketRef.current.on('user_joined', (data) => {
      setUsers((cur) => [...cur, data])
    })

    createStream(currentCamera, currentAudio).then((stream) => {
      setStream(stream)
    })
  }, [])

  return (
    <div className="App">
      <div>
        <p>List user: </p>
        <ul>
          {users.map((user, i) => (
            <li key={i}>{user}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Room
