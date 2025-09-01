import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',                    // Landing page
  '/auth/sign-in(.*)',    // Sign-in page
  '/auth/sign-up(.*)',    // Sign-up page
  '/auth/invitation(.*)', // Invitation sign-up page
  '/auth/sso-callback(.*)', // SSO callback page
  '/auth/reset-password', // Reset password page
  '/api/webhooks/clerk',  // Clerk webhook endpoint 
  '/api/leads/add-lead',  // ✅ Allow anonymous form submissions
  '/api/integrations/microsoft-ads/callback(.*)', // ✅ Microsoft Ads OAuth callback
])

export default clerkMiddleware((auth, req) => {
  const response = NextResponse.next()
  response.headers.set('x-pathname', req.nextUrl.pathname)
  
  // Special handling for Microsoft Ads OAuth callback
  if (req.nextUrl.pathname.startsWith('/api/integrations/microsoft-ads/callback')) {
    // Allow OAuth callback to proceed without authentication
    // The route handler will validate the state parameter which contains org/user info
    return response
  }
  
  if (!isPublicRoute(req)) {
    auth.protect()
  }
  
  return response
})

// Stop Middleware running on static files
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}