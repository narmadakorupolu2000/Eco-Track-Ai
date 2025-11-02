import type { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// NextAuth configuration with credentials provider only
const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      try {
        // Call your existing backend API for credentials login
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/auth/token?email=${credentials.email}&password=${credentials.password}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          return null
        }

        const data = await response.json()
        
        if (data.user) {
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.full_name,
            username: data.user.username,
          }
        }

        return null
      } catch (error) {
        console.error('Credentials auth error:', error)
        return null
      }
    }
  })
]

// NextAuth configuration
const handler = NextAuth({
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).username = token.username as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }
