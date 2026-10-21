export type BillStatus = "belum_bayar" | "sebagian" | "lunas";

export interface Bill {
  id: string;
  lender: string;
  amount: number;
  dueDate: string; // ISO "yyyy-mm-dd"
  paidAmount: number;
  remainingAmount: number;
  status: BillStatus;
  deskripsi: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillInput {
  lender: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  deskripsi: string;
}

export interface BillFilters {
  from?: string;
  to?: string;
  lender?: string;
  status?: BillStatus;
  q?: string;
}

export interface LenderSummary {
  lender: string;
  count: number;
  total: number;
  paid: number;
  remaining: number;
}

export interface BillSummary {
  total: number;
  paid: number;
  remaining: number;
  remainingAll: number;
  perLender: LenderSummary[];
}

export interface Lender {
  id: string;
  name: string;
}

export interface User {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  belum_bayar: "Belum Bayar",
  sebagian: "Dibayar Sebagian",
  lunas: "Lunas",
};

export function deriveStatus(paid: number, amount: number): BillStatus {
  if (paid <= 0) return "belum_bayar";
  if (paid >= amount) return "lunas";
  return "sebagian";
}

export function deriveRemaining(amount: number, paid: number): number {
  return Math.max(0, Math.round(amount - paid));
}
