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
  const refVideo = useRef(null)
  const socketRef = useRef()
  const peersRef = useRef([])

  const [peers, setPeers] = useState([])
  const { devices } = useMediaDevices()
  const [audios, setAudios] = useState([])
  const [videos, setVideos] = useState([])
  const [currentCamera, setCurrentCamera] = useState(null)
  const [currentAudio, setCurrentAudio] = useState(null)
  const roomID = props.match.params.roomID

  async function stream(cameraId, audioId) {
    if (!cameraId && !audioId) return

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

    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    socketRef.current.on('all users', (users) => {
      const peers = []
      users.forEach((userID) => {
        const peer = createPeer(userID, socketRef.current.id, stream)
        peersRef.current.push({
          peerID: userID,
          peer,
        })
        peers.push(peer)
      })
      setPeers(peers)
    })

    socketRef.current.on('user joined', (payload) => {
      const peer = addPeer(payload.signal, payload.callerID, stream)
      peersRef.current.push({
        peerID: payload.callerID,
        peer,
      })

      setPeers((users) => [...users, peer])
    })

    socketRef.current.on('receiving returned signal', (payload) => {
      const item = peersRef.current.find((p) => p.peerID === payload.id)
      item.peer.signal(payload.signal)
    })
  }

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    })

    peer.on('signal', (signal) => {
      socketRef.current.emit('sending signal', {
        userToSignal,
        callerID,
        signal,
      })
    })

    return peer
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    })

    peer.on('signal', (signal) => {
      socketRef.current.emit('returning signal', { signal, callerID })
    })

    peer.signal(incomingSignal)

    return peer
  }

  async function updateDevices(listDevices) {
    const listAudio = []
    const listVideo = []

    if (!listDevices) return

    for (let i = 0; i !== listDevices.length; ++i) {
      if (listDevices[i].kind === 'audioinput') {
        listAudio.push({
          id: listDevices[i].deviceId,
          text: listDevices[i].label || `speaker ${listAudio.length + 1}`,
        })
      }
      if (listDevices[i].kind === 'videoinput') {
        listVideo.push({
          id: listDevices[i].deviceId,
          text: listDevices[i].label || `video ${listAudio.length + 1}`,
        })
      }
    }
    setAudios(listAudio)
    setVideos(listVideo)
    setCurrentAudio(listAudio[0].id)
    setCurrentCamera(listVideo[0].id)
  }

  useEffect(() => {
    socketRef.current = io.connect('/')

    socketRef.current.emit('join room', roomID)
  }, [])

  useEffect(() => {
    updateDevices(devices)
  }, [devices])

  useEffect(() => {
    stream(currentCamera, currentAudio)
  }, [currentCamera, currentAudio])

  return (
    <div className="App">
      <p>Hello World</p>

      {peers.map((peer, index) => {
        return <Video peer={peer} />
      })}

      <div>
        <p>List Audio:</p>
        <select
          value={currentAudio}
          onChange={(e) => setCurrentAudio(e.target.value)}
        >
          {audios.map((audio, i) => (
            <option key={i} value={audio.id}>
              {audio.text}
            </option>
          ))}
          <option value={''}>None</option>
        </select>
      </div>
      <div>
        <p>List Video:</p>
        <select
          value={currentCamera}
          onChange={(e) => setCurrentCamera(e.target.value)}
        >
          {videos.map((video, i) => (
            <option key={i} value={video.id}>
              {video.text}
            </option>
          ))}
          <option value={''}>None</option>
        </select>
      </div>
    </div>
  )
}

export default Room
