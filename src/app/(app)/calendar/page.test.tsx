import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { toISODate } from "@/lib/format"

const today = toISODate(new Date())

vi.mock("@/hooks/use-reports", () => ({
  useCalendar: (from: string, to: string) => ({
    data: {
      from,
      to,
      days: [
        {
          date: today,
          income: 500000,
          expense: 250000,
          net: 250000,
          transactionCount: 1,
          transactions: [
            {
              id: "t1",
              type: "EXPENSE",
              amount: 250000,
              memo: "Kopi Kenangan",
              note: "",
              date: today,
              transactionTypeId: "tt",
              wallet: {
                id: "w1",
                name: "GoPay",
                type: "ewallet",
                color: "#0EA5E9",
                icon: "wallet",
              },
              category: {
                id: "c1",
                name: "Kopi",
                icon: "coffee",
                bgColor: "#0EA5E9",
              },
              createdAt: "",
              updatedAt: "",
            },
          ],
          bills: [
            {
              id: "b1",
              lenderId: "l1",
              lender: { id: "l1", name: "Kredivo" },
              amount: 1000000,
              paidAmount: 0,
              remainingAmount: 1000000,
              status: "belum_bayar",
              isOverdue: false,
              daysUntilDue: 2,
              dueDate: today,
              deskripsi: "Cicilan iPhone",
              remindH3: true,
              remindH1: true,
              remindDue: true,
              currency: "IDR",
              createdAt: "",
              updatedAt: "",
            },
          ],
        },
      ],
      summary: { from, to, income: 500000, expense: 250000, net: 250000, count: 1 },
      billsDue: 1000000,
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: () => undefined,
  }),
}))

import CalendarPage from "./page"

describe("CalendarPage", () => {
  it("berpindah ke tampilan minggu tanpa error", () => {
    render(<CalendarPage />)

    fireEvent.click(screen.getByRole("button", { name: "Minggu" }))

    expect(screen.getByRole("button", { name: "Minggu" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getAllByText(/Kredivo/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Kopi Kenangan/).length).toBeGreaterThan(0)
  })
})
