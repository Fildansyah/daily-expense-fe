export interface User {
  id: string
  createdAt: string
  firstName: string
  lastName: string
  email: string
}

export interface AuthResponse {
  accessToken: string
  expiresIn: number
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
}
