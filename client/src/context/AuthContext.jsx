import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('gn_token')
    if (token) {
      api.get('/users/me')
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('gn_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('gn_token', res.data.token)
    const me = await api.get('/users/me')
    setUser(me.data)
    return me.data
  }

  const register = async (email, password, full_name) => {
    const res = await api.post('/auth/register', { email, password, full_name })
    localStorage.setItem('gn_token', res.data.token)
    const me = await api.get('/users/me')
    setUser(me.data)
    return me.data
  }

  const logout = () => {
    localStorage.removeItem('gn_token')
    setUser(null)
  }

  const refreshUser = async () => {
    const res = await api.get('/users/me')
    setUser(res.data)
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
