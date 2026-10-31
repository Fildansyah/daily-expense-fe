import { PUBLIC_URL, requestUrl } from "./client"
import type { AuthResponse, RegisterInput, User } from "./types/user"

export const authApi = {
  login(email: string, password: string) {
    return requestUrl<AuthResponse>(
      `${PUBLIC_URL}/user/login`,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      { auth: false, retryOn401: false },
    )
  },

  register(input: RegisterInput) {
    return requestUrl<User>(
      `${PUBLIC_URL}/user`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      { auth: false, retryOn401: false },
    )
  },

  refresh() {
    return requestUrl<AuthResponse>(
      `${PUBLIC_URL}/auth/refresh`,
      { method: "POST" },
      { auth: false, retryOn401: false },
    )
  },

  logout() {
    return requestUrl<{ message: string }>(
      `${PUBLIC_URL}/auth/logout`,
      { method: "POST" },
      { auth: false, retryOn401: false },
    )
  },
}
