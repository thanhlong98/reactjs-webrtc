import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import CreateRoom from './pages/createRoom'
import Room from './pages/room'
import Room2 from './pages/room2'

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={CreateRoom} />
        <Route path="/room/:roomID" component={Room} />
        <Route path="/room2/:roomID" component={Room2} />
      </Switch>
    </BrowserRouter>
  )
}

export default App
