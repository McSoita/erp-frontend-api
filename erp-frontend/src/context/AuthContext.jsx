import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'

function getStoredUser() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  if (!token) {
    return null
  }

  const storedUser = localStorage.getItem(USER_STORAGE_KEY)

  if (!storedUser) {
    return { token }
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    return { token }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())

  const login = (token, userData) => {
    const nextUser = userData ?? { token }

    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
