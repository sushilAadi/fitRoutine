import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export function adminMiddleware(request) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Note: This is a basic check. In production, you might want to 
  // fetch the user's role from Clerk or your database
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};