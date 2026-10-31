import { request } from "./client"
import type { User } from "./types/user"

export const userApi = {
  me() {
    return request<User>("/user/me")
  },
}
