import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      company?: string
      role?: string
    }
  }

  interface User {
    id: string
    name: string
    email: string
    company?: string
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    company?: string
    role?: string
  }
} 