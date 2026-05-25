import { createContext, useContext, useState } from 'react'
import { resolveUserRole } from '../utils/permissions'

const AuthContext = createContext(null)

const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'

function hydrateUser(user) {
  if (!user) {
    return null
  }

  const resolvedRole = resolveUserRole(user)

  if (!resolvedRole) {
    return user
  }

  return {
    ...user,
    role: resolvedRole,
  }
}

function getStoredUser() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  if (!token) {
    return null
  }

  const storedUser = localStorage.getItem(USER_STORAGE_KEY)

  if (!storedUser) {
    return hydrateUser({ token })
  }

  try {
    return hydrateUser(JSON.parse(storedUser))
  } catch {
    return hydrateUser({ token })
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())

  const login = (token, userData) => {
    const nextUser = hydrateUser(userData ?? { token })

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
