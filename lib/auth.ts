import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        console.log('🔐 Auth attempt:', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            companyId: true,
            role: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        if (!user) {
          console.log('❌ User not found:', credentials.email)
          return null
        }

        console.log('✅ User found:', { id: user.id, email: user.email, role: user.role })

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        console.log('🔑 Password valid:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('❌ Invalid password')
          return null
        }

        console.log('🎉 Auth successful!')
        return {
          id: user.id,
          email: user.email,
          name: user.name || '',
          company: user.company?.name || '',
          companyId: user.companyId || '',
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 gün
    updateAge: 60 * 60,   // Her 1 saatte bir yenile
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.company = user.company
        token.companyId = user.companyId
        token.role = user.role
      }
      
      // Session update edildiğinde fresh data al
      if (trigger === 'update' && token.sub) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            name: true,
            email: true,
            companyId: true,
            role: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
        
        if (freshUser) {
          token.name = freshUser.name || ''
          token.email = freshUser.email
          token.company = freshUser.company?.name || ''
          token.companyId = freshUser.companyId || ''
          token.role = freshUser.role
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.company = token.company as string
        session.user.companyId = token.companyId as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
} 