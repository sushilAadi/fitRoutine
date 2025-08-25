import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

// Define protected admin routes
const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isAdminAPIRoute = createRouteMatcher(['/api/admin(.*)']);

// Define public API routes that don't need authentication
const isPublicAPIRoute = createRouteMatcher([
  '/api/razorpay/(.*)',
  '/api/auth/(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  // Skip authentication for public API routes
  if (isPublicAPIRoute(request)) {
    return;
  }

  // Check if this is an admin route (pages or API)
  if (isAdminRoute(request) || isAdminAPIRoute(request)) {
    const { userId } = await auth();
    
    // For API routes, return 401 if not authenticated
    if (!userId) {
      if (isAdminAPIRoute(request)) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      // For page routes, redirect to sign-in
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    // Note: Additional admin role check is done in the API routes themselves
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