import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatAddress(address: unknown): string {
    if (typeof address !== 'string' || address.length < 10) return String(address)
    return `${address.slice(0, 6)}…${address.slice(-4)}`
  }
  