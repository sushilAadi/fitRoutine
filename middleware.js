import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

// Define protected admin routes
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // Check if this is an admin route
  if (isAdminRoute(request)) {
    const { userId } = auth();
    
    // Redirect to sign-in if not authenticated
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    // Note: Additional admin role check is done in the component itself
    // since we need the user object with publicMetadata
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};