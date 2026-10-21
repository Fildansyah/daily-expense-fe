"use client"

import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

type Mode = "login" | "register"

export default function LoginPage() {
  const { login, register } = useAuth()

  const [mode, setMode] = useState<Mode>("login")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)

    try {
      if (mode === "login") {
        await login(email, password)
        toast.success("Selamat datang kembali")
      } else {
        await register({ firstName, lastName, email, password })
        toast.success("Registrasi berhasil, silakan login")
        setMode("login")
        setPassword("")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-5 p-6">
          <div className="text-center">
            <p className="text-xl font-semibold">Daily Expense</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login"
                ? "Masuk untuk melanjutkan"
                : "Buat akun baru"}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Nama Depan</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Nama Belakang</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="animate-spin" />}
              {mode === "login" ? "Masuk" : "Daftar"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-medium text-primary hover:underline"
                >
                  Daftar
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-medium text-primary hover:underline"
                >
                  Masuk
                </button>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
