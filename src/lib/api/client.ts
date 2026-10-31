import type { AuthResponse } from "./types/user"

function normalizeApiUrl(raw: string): string {
  const value = raw.trim().replace(/\/+$/, "")
  if (!value) return ""
  if (value.startsWith("/")) return value
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value.replace(/^\/+/, "")}`
}

export const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL ?? "")
export const API_CONFIGURED = API_URL.length > 0
export const PUBLIC_URL = API_URL
  ? `${API_URL.replace(/\/api$/, "")}/public`
  : "/public"

if (API_URL && !API_URL.endsWith("/api")) {
  console.warn(
    `NEXT_PUBLIC_API_URL sebaiknya diakhiri "/api" (nilai sekarang: ${API_URL}).`,
  )
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status = 0, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

let accessToken: string | null = null
let unauthorizedHandler: (() => void) | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

interface Envelope<T> {
  status?: string
  data?: T
  error?: string
  code?: string
}

interface RequestOptions {
  auth?: boolean
  retryOn401?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const result = await requestUrl<AuthResponse>(
          `${PUBLIC_URL}/auth/refresh`,
          { method: "POST" },
          { auth: false, retryOn401: false },
        )
        setAccessToken(result.accessToken)
        return result.accessToken
      } catch {
        setAccessToken(null)
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

export async function requestUrl<T>(
  url: string,
  init?: RequestInit,
  options: RequestOptions = {},
): Promise<T> {
  if (!API_CONFIGURED) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL belum diatur. Isi dengan URL API, mis. http://localhost:8000/api",
    )
  }

  const { auth = true, retryOn401 = true } = options

  const headers = new Headers(init?.headers)
  headers.set("Accept", "application/json")
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (auth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: auth ? "same-origin" : "include",
  })

  if (response.status === 204) {
    return undefined as T
  }

  let body: Envelope<T> | null = null
  try {
    body = (await response.json()) as Envelope<T>
  } catch {
    /* respons tanpa JSON */
  }

  if (response.status === 401) {
    if (auth && retryOn401) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return requestUrl<T>(url, init, { auth: true, retryOn401: false })
      }
    }

    if (auth) {
      setAccessToken(null)
      unauthorizedHandler?.()
      throw new ApiError(
        body?.error ?? "Sesi berakhir, silakan login kembali",
        response.status,
        body?.code,
      )
    }

    throw new ApiError(
      body?.error ?? "Email atau kata sandi salah",
      response.status,
      body?.code,
    )
  }

  if (!response.ok || body?.status === "error") {
    throw new ApiError(
      body?.error ?? `Request gagal (${response.status})`,
      response.status,
      body?.code,
    )
  }

  if (body && typeof body === "object" && "data" in body) {
    return body.data as T
  }

  return body as T
}

export function request<T>(
  path: string,
  init?: RequestInit,
  options?: RequestOptions,
): Promise<T> {
  return requestUrl<T>(`${API_URL}${path}`, init, options)
}

export function toQuery(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ""
}
