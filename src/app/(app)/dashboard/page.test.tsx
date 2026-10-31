import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "u1", firstName: "Fildan", lastName: "Pratama", email: "f@x.dev" },
    status: "authenticated",
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-period", () => ({
  usePeriodRange: () => ({
    from: "2026-10-01",
    to: "2026-10-31",
    range: { from: "2026-10-01", to: "2026-10-31" },
    setRange: vi.fn(),
    setMonth: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-reports", () => ({
  useDashboard: () => ({
    data: {
      period: { from: "2026-10-01", to: "2026-10-31" },
      kpi: {
        totalBalance: 13795000,
        income: 12500000,
        expense: 7340000,
        net: 5160000,
        debt: 5180000,
        incomeDelta: 12.4,
        expenseDelta: -3.5,
        netDelta: 10,
        debtDelta: 0,
      },
      cashflow: [
        { period: "2026-05-01", income: 9000000, expense: 5000000, net: 4000000 },
        { period: "2026-06-01", income: 10000000, expense: 6000000, net: 4000000 },
        { period: "2026-07-01", income: 11000000, expense: 7000000, net: 4000000 },
        { period: "2026-08-01", income: 12000000, expense: 6500000, net: 5500000 },
        { period: "2026-09-01", income: 11500000, expense: 8000000, net: 3500000 },
        { period: "2026-10-01", income: 12500000, expense: 7340000, net: 5160000 },
      ],
      categoryBreakdown: [
        {
          categoryId: "c1",
          name: "Makan & Minum",
          icon: "utensils",
          bgColor: "#0F766E",
          amount: 2180000,
          percentage: 29.7,
          count: 12,
        },
      ],
      upcomingBills: [
        {
          id: "b1",
          lenderId: "l1",
          lender: { id: "l1", name: "Kredivo" },
          amount: 1000000,
          paidAmount: 200000,
          remainingAmount: 800000,
          status: "sebagian",
          isOverdue: false,
          daysUntilDue: 3,
          dueDate: "2026-10-30",
          deskripsi: "Cicilan iPhone",
          remindH3: true,
          remindH1: true,
          remindDue: true,
          currency: "IDR",
          createdAt: "",
          updatedAt: "",
        },
      ],
      recentTransactions: [
        {
          id: "t1",
          type: "EXPENSE",
          amount: 45000,
          memo: "Kopi Kenangan",
          note: "",
          date: "2026-10-28",
          transactionTypeId: "tt",
          wallet: { id: "w1", name: "GoPay", type: "ewallet", color: "#0EA5E9", icon: "wallet" },
          category: { id: "c1", name: "Kopi", icon: "coffee", bgColor: "#0EA5E9" },
          createdAt: "",
          updatedAt: "",
        },
      ],
      budgetProgress: [
        {
          id: "bg1",
          categoryId: "c1",
          periodMonth: "2026-10",
          amount: 3200000,
          categoryName: "Makan & Minum",
          categoryIcon: "utensils",
          categoryColor: "#0F766E",
          spent: 2180000,
          remaining: 1020000,
          percentage: 68.1,
          status: "aman",
          createdAt: "",
          updatedAt: "",
        },
      ],
      creditUtilization: [
        {
          walletId: "w2",
          name: "Kartu Kredit BCA",
          color: "#0F766E",
          limit: 25000000,
          used: 7850000,
          available: 17150000,
          utilization: 31.4,
        },
      ],
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

import DashboardPage from "./page"

describe("DashboardPage", () => {
  it("merender semua section dengan data", () => {
    render(<DashboardPage />)

    expect(screen.getByText(/Total Saldo/)).toBeInTheDocument()
    expect(screen.getByText(/Arus Kas/)).toBeInTheDocument()
    expect(screen.getByText(/Kategori/)).toBeInTheDocument()
    expect(screen.getByText(/Kredivo/)).toBeInTheDocument()
    expect(screen.getByText(/Kopi Kenangan/)).toBeInTheDocument()
    expect(screen.getByText(/Kartu Kredit BCA/)).toBeInTheDocument()
    expect(screen.getAllByText(/Makan & Minum/).length).toBeGreaterThan(0)
  })
})
