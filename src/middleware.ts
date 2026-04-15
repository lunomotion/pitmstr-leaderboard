import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — anyone can access without signing in
const isPublicRoute = createRouteMatcher([
  // Public pages
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/leaderboard(.*)",
  "/events(.*)",
  "/teams(.*)",
  "/schools(.*)",
  "/knowledge-base(.*)",

  // QR code scan routes (judges access without login)
  "/scan(.*)",

  // Public invoice payment pages + checkout
  "/pay(.*)",
  "/api/billing/checkout",

  // Public API routes (read-only data)
  "/api/events(.*)",
  "/api/leaderboard(.*)",
  "/api/stats(.*)",
  "/api/teams(.*)",
  "/api/schools(.*)",

  // Scoring APIs (judges submit via QR scan, no login)
  "/api/scoring(.*)",

  // Clerk webhook (called by Clerk servers, not users)
  "/api/webhooks/clerk",

  // Stripe webhook (called by Stripe servers)
  "/api/webhooks/stripe",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // Not a public route — user must be signed in
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
