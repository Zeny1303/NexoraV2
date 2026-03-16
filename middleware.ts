import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    '/',
    '/events/:id',
    '/api/webhook/clerk',
    '/api/uploadthing',   // ← ADD LINE
  ],
  ignoredRoutes: [
    '/api/webhook/clerk',
    '/api/uploadthing',   // ← AND THIS
    '/api/map-events',
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};