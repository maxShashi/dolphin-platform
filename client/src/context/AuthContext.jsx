import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        const response = await auth.getMe()
        setUser(response.data.data)
        setToken(storedToken)
      } catch (error) {
        console.error('Token verification failed:', error)
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await auth.login(email, password)
    const { token: newToken, user: userData } = response.data.data
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(userData)
    navigate('/dashboard')
    return response.data
  }, [navigate])

  const register = useCallback(async (data) => {
    const response = await auth.register(data)
    const { token: newToken, user: userData } = response.data.data
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(userData)
    navigate('/dashboard')
    return response.data
  }, [navigate])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    navigate('/login')
  }, [navigate])

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext