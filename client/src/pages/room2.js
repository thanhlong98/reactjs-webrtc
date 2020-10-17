import React, { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import useMediaDevices from '../hooks/useMediaDevices'
import Peer from 'simple-peer'
import Video from '../components/video'

// Free public STUN servers provided by Google.
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
}

const Room = (props) => {
  const roomID = props.match.params.roomID
  const socketRef = useRef()
  const localVideo = useRef()
  const rtcPeerConnection = useRef()
  const peersRef = useRef([])

  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState([])
  const [peerConnections, setPeerConnections] = useState({})
  const [selectedVideo, setSelectedVideo] = useState(null)

  const { devices } = useMediaDevices()
  const [stream, setStream] = useState(null)
  const [users, setUsers] = useState([])
  const [peers, setPeers] = useState([])
  const [listAudio, setListAudio] = useState([])
  const [listCamera, setListCamera] = useState([])
  const [currentCamera, setCurrentCamera] = useState(null)
  const [currentAudio, setCurrentAudio] = useState(null)

  async function updateDevices(devices) {
    if (devices) {
      const audios = []
      const cameras = []
      for (let i = 0; i < devices.length; i++) {
        if (devices[i].kind === 'videoinput') cameras.push(devices[i])
        if (devices[i].kind === 'audioinput') audios.push(devices[i])
      }
      setListAudio(audios)
      setListCamera(cameras)
      setCurrentAudio(audios[0].deviceId)
      setCurrentCamera(cameras[0].deviceId)
    }
  }

  async function openStream(cameraId, audioId) {
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
            width: { min: 700 },
            height: { min: 500 },
          }
        : false,
    }

    return await navigator.mediaDevices.getUserMedia(constraints)
  }

  async function sendToPeer(messageType, payload, socketId) {
    socketRef.current.emit(messageType, {
      socketId,
      payload,
    })
  }

  async function createPeer(socketIdRemote) {
    const peer = new RTCPeerConnection(iceServers)
    setPeerConnections((prev) => ({ ...prev, [socketIdRemote]: peer }))
    peer.onicecandidate = (e) => {
      if (e.candidate) {
        sendToPeer('candidate', e.candidate, {
          local: socketRef.current.id,
          remote: socketIdRemote,
        })
      }
    }

    peer.onconnectionstatechange = (e) => {}

    peer.ontrack = (e) => {
      const remoteVideo = {
        id: socketIdRemote,
        name: socketIdRemote,
        stream: e.streams[0],
      }

      const selectedVideoT = remoteStreams.filter(
        (stream) => stream.id === selectedVideo.id
      )

      setSelectedVideo(
        selectedVideoT.length ? {} : { selectedVideo: remoteVideo }
      )
      setRemoteStream(
        remoteStreams.length > 0 ? {} : { remoteStream: e.streams[0] }
      )
      setRemoteStreams((prev) => [...prev, remoteVideo])
    }

    peer.close = () => {}

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream)
      })
    }

    return peer
  }

  useEffect(() => {
    socketRef.current = io.connect('/')
    socketRef.current.emit('join', roomID)
    socketRef.current.on('list_user', (users) => {
      setUsers([...users])
    })

    socketRef.current.on('new_user', (data) => {
      setUsers((cur) => [...cur, data])
    })

    socketRef.current.on('peer_disconnected', (peerId) => {
      setUsers((cur) => cur.filter((id) => id !== peerId))
    })

    socketRef.current.on(('online-peer', socketId))
  }, [])

  useEffect(() => {
    updateDevices(devices)
  }, [devices])

  useEffect(() => {
    openStream(currentCamera, currentAudio).then((stream) => {
      setStream(stream)
    })
  }, [currentAudio, currentCamera])

  useEffect(() => {
    if (stream) {
      window.localStream = stream
      setLocalStream(stream)
    }
  }, [stream])

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

      <div>
        <p>List Audio: </p>
        <select>
          {listAudio.map((audio, i) => (
            <option key={i} value={audio.deviceId}>
              {audio.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p>List Camera: </p>
        <select>
          {listCamera.map((camera, i) => (
            <option key={i} value={camera.deviceId}>
              {camera.label}
            </option>
          ))}
        </select>
      </div>
      <Video videoStream={localStream} />
    </div>
  )
}

export default Room
