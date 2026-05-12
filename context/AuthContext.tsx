import { getCurrentUser } from '@/lib/auth'
import { createContext, useContext, useEffect, useState } from 'react'

type User = {
  $id: string
  name: string
  email: string
} | null

type AuthContextType = {
  user: User
  loading: boolean
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUser(u as User))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)