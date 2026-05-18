import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import ProtectedRoute from './components/shared/ProtectedRoute'
import Navbar from './components/shared/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import CourtDetail from './pages/CourtDetail'
import Profile from './pages/Profile'
import AddCourt from './pages/AddCourt'
import MyGames from './pages/MyGames'

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout><Home /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/court/:id"
              element={
                <ProtectedRoute>
                  <Layout><CourtDetail /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout><Profile /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-court"
              element={
                <ProtectedRoute>
                  <Layout><AddCourt /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-games"
              element={
                <ProtectedRoute>
                  <Layout><MyGames /></Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
