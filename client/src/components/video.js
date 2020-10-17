import React, { useEffect, useRef } from 'react'

const Video = ({ videoStream }) => {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoStream) {
      videoRef.current.srcObject = videoStream
    }
  }, [videoStream])

  return (
    <div>
      <video autoPlay ref={videoRef}></video>
    </div>
  )
}

export default Video
