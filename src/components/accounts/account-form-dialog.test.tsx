import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
}))

vi.mock("@/hooks/use-wallets", () => ({
  useCreateWallet: () => ({ mutate: mocks.create, isPending: false }),
  useUpdateWallet: () => ({ mutate: mocks.update, isPending: false }),
}))

import { AccountFormDialog } from "./account-form-dialog"

describe("AccountFormDialog", () => {
  it("memvalidasi nama dan limit kartu kredit", () => {
    render(<AccountFormDialog open onOpenChange={() => undefined} />)

    fireEvent.click(screen.getByRole("button", { name: /Simpan Akun/ }))
    expect(screen.getByRole("alert")).toHaveTextContent("Nama akun wajib diisi")

    fireEvent.change(screen.getByPlaceholderText("mis. BCA Tahapan Baru"), {
      target: { value: "BCA Baru" },
    })

    fireEvent.click(screen.getByRole("button", { name: /Kartu Kredit/ }))
    fireEvent.click(screen.getByRole("button", { name: /Simpan Akun/ }))

    expect(screen.getByRole("alert")).toHaveTextContent("Limit kredit wajib diisi")
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
