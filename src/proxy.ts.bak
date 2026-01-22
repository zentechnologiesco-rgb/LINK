import { convexAuthNextjsMiddleware, createRouteMatcher, nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in",
    "/sign-up",
    "/search(.*)",
    "/properties(.*)",
    "/api(.*)",
]);

// Next.js 16 uses "proxy" instead of "middleware" 
export const proxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
    const { pathname } = request.nextUrl;
    const isAuthenticated = await convexAuth.isAuthenticated();

    // If not authenticated and trying to access protected route
    if (!isPublicRoute(request) && !isAuthenticated) {
        return nextjsMiddlewareRedirect(request, "/sign-in");
    }

    // If authenticated and trying to access auth pages
    if (isAuthenticated && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
        return nextjsMiddlewareRedirect(request, "/dashboard/tenant");
    }

    // Role-based protection is handled at page level
});

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
