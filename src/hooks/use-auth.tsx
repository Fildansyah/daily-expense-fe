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
import { useQueryClient } from "@tanstack/react-query"

import {
  authApi,
  setAccessToken,
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
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const AUTH_CHANNEL = "daily-expense-auth"

// User palsu untuk mode mock — auth dilewati karena tidak ada backend.
const MOCK_USER: User = {
  id: "mock-user",
  createdAt: "",
  firstName: "Pengguna",
  lastName: "Mock",
  email: "mock@local.dev",
}

function broadcastAuth(message: "login" | "logout") {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return
  const channel = new BroadcastChannel(AUTH_CHANNEL)
  channel.postMessage(message)
  channel.close()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    USE_MOCK ? MOCK_USER : null,
  )
  const [status, setStatus] = useState<AuthStatus>(() =>
    USE_MOCK ? "authenticated" : "loading",
  )
  const router = useRouter()
  const queryClient = useQueryClient()

  const applySession = useCallback((nextUser: User) => {
    setUser(nextUser)
    setStatus("authenticated")
  }, [])

  const clearSession = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setStatus("unauthenticated")
    // Jangan biarkan data user sebelumnya tersaji dari cache setelah login user lain.
    queryClient.clear()
  }, [queryClient])

  // Pulihkan sesi saat aplikasi dimuat (mode API).
  // Access token hanya ada di memori, jadi selalu minta yang baru via cookie refresh.
  useEffect(() => {
    if (USE_MOCK) return

    let cancelled = false

    authApi
      .refresh()
      .then((res) => {
        if (cancelled) return
        setAccessToken(res.accessToken)
        applySession(res.user)
      })
      .catch(() => {
        if (cancelled) return
        clearSession()
      })

    return () => {
      cancelled = true
    }
  }, [applySession, clearSession])

  // 401 dari request terautentikasi yang gagal di-refresh.
  useEffect(() => {
    if (USE_MOCK) return

    setUnauthorizedHandler(() => {
      clearSession()
    })

    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  // Sinkronisasi login/logout antar tab.
  useEffect(() => {
    if (USE_MOCK) return
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return

    const channel = new BroadcastChannel(AUTH_CHANNEL)
    channel.onmessage = (event: MessageEvent) => {
      if (event.data === "logout") {
        clearSession()
        return
      }
      if (event.data === "login") {
        authApi
          .refresh()
          .then((res) => {
            setAccessToken(res.accessToken)
            applySession(res.user)
          })
          .catch(() => {
            /* tab ini akan mencoba lagi saat ada request */
          })
      }
    }

    return () => channel.close()
  }, [applySession, clearSession])

  const login = useCallback(
    async (email: string, password: string) => {
      if (USE_MOCK) {
        applySession(MOCK_USER)
        broadcastAuth("login")
        return
      }

      const res = await authApi.login(email.trim().toLowerCase(), password)
      setAccessToken(res.accessToken)
      applySession(res.user)
      queryClient.clear()
      broadcastAuth("login")
    },
    [applySession, queryClient],
  )

  const register = useCallback(async (input: RegisterInput) => {
    if (USE_MOCK) return
    await authApi.register({
      ...input,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
    })
  }, [])

  const logout = useCallback(async () => {
    if (!USE_MOCK) {
      try {
        await authApi.logout()
      } catch {
        /* tetap bersihkan sesi lokal walau server tidak terjangkau */
      }
    }

    clearSession()
    broadcastAuth("logout")
    router.replace("/login")
  }, [clearSession, router])

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
