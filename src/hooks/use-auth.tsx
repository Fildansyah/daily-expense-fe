"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"

import {
  authApi,
  clearToken,
  getToken,
  setToken,
  setUnauthorizedHandler,
  USE_MOCK,
} from "@/lib/api"
import type { RegisterInput, User } from "@/lib/types"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// User palsu untuk mode mock — auth dilewati karena tidak ada backend.
const MOCK_USER: User = {
  id: "mock-user",
  createdAt: "",
  firstName: "Pengguna",
  lastName: "Mock",
  email: "mock@local.dev",
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Status awal ditentukan saat render (lazy initializer), bukan lewat
  // effect, agar tidak ada setState sinkron di dalam effect.
  const [user, setUser] = useState<User | null>(() =>
    USE_MOCK ? MOCK_USER : null,
  )
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (USE_MOCK) return "authenticated"
    // Ada token tersimpan → periksa dulu validitasnya; tanpa token → langsung
    // dianggap belum login.
    return getToken() ? "loading" : "unauthenticated"
  })
  const router = useRouter()

  // Pulihkan sesi saat aplikasi dimuat (hanya mode API).
  // Token yang tersimpan divalidasi lewat GET /user/me.
  useEffect(() => {
    if (USE_MOCK) return

    const token = getToken()
    if (!token) return // status sudah "unauthenticated" dari initializer

    let cancelled = false

    authApi
      .me()
      .then((u) => {
        if (cancelled) return
        setUser(u)
        setStatus("authenticated")
      })
      .catch(() => {
        if (cancelled) return
        clearToken()
        setUser(null)
        setStatus("unauthenticated")
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Tangani 401 dari request API manapun: bersihkan state auth.
  // AppShell akan mengarahkan ke /login saat status jadi unauthenticated.
  useEffect(() => {
    if (USE_MOCK) return

    setUnauthorizedHandler(() => {
      setUser(null)
      setStatus("unauthenticated")
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    setToken(res.token)
    const u = await authApi.me()
    setUser(u)
    setStatus("authenticated")
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    await authApi.register(input)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setStatus("unauthenticated")
    router.replace("/login")
  }, [router])

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>")
  }
  return ctx
}
