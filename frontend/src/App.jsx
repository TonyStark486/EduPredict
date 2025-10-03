import React from 'react'
import { Routes, Route } from 'react-router-dom'

function Home() {
  return <h1>Welcome to EduPredict - SIH</h1>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
