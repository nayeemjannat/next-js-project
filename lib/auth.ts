// Authentication utilities and types
export type UserType = "customer" | "provider" | "admin"

export interface User {
  id: string
  email: string
  name: string
  userType: UserType
  avatar?: string
  phone?: string
  isVerified?: boolean
  verificationStatus?: "pending" | "approved" | "rejected"
  verifiedAt?: string
  rejectionReason?: string
  createdAt: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, userType: UserType) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 6
}
