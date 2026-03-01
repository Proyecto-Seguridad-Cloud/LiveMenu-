/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'
import { authService } from '../services/auth'

type AuthContextValue = {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => authService.getToken())

  const value = useMemo<AuthContextValue>(() => {
    return {
      token,
      isAuthenticated: Boolean(token),
      login: (incomingToken: string) => {
        authService.setToken(incomingToken)
        setToken(incomingToken)
      },
      logout: async () => {
        if (token) {
          await authService.logout(token)
        }
        authService.clearToken()
        setToken(null)
      },
    }
  }, [token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
