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

import { authApi } from "@/lib/api/auth"
import {
  API_CONFIGURED,
  setAccessToken,
  setUnauthorizedHandler,
} from "@/lib/api/client"
import type { RegisterInput, User } from "@/lib/api/types/user"

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

function broadcastAuth(message: "login" | "logout") {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return
  const channel = new BroadcastChannel(AUTH_CHANNEL)
  channel.postMessage(message)
  channel.close()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(
    API_CONFIGURED ? "loading" : "unauthenticated",
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
    queryClient.clear()
  }, [queryClient])

  // Pulihkan sesi saat aplikasi dimuat. Access token hanya di memori,
  // jadi selalu minta yang baru lewat cookie refresh.
  useEffect(() => {
    if (!API_CONFIGURED) {
      return
    }

    let cancelled = false

    authApi
      .refresh()
      .then((result) => {
        if (cancelled) return
        setAccessToken(result.accessToken)
        applySession(result.user)
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
    setUnauthorizedHandler(() => {
      clearSession()
    })

    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  // Sinkronisasi login/logout antar tab.
  useEffect(() => {
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
          .then((result) => {
            setAccessToken(result.accessToken)
            applySession(result.user)
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
      const response = await authApi.login(email.trim().toLowerCase(), password)
      setAccessToken(response.accessToken)
      applySession(response.user)
      queryClient.clear()
      broadcastAuth("login")
    },
    [applySession, queryClient],
  )

  const register = useCallback(async (input: RegisterInput) => {
    await authApi.register({
      ...input,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
    })
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      /* tetap bersihkan sesi lokal walau server tidak terjangkau */
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
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>")
  }
  return context
}
