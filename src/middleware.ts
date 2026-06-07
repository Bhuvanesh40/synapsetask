import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export default NextAuth(authConfig).auth

export const config = {
  // Protect all paths under dashboard/meetings and exclude auth endpoints, static assets, etc.
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
