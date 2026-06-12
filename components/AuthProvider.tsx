'use client'

import { createContext, useContext, ReactNode } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { User } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface AuthContextType {
  user: FirebaseUser | null
  userData: User | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => useContext(AuthContext)
