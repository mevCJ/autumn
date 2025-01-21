import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
  currentUser,
} from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { AppEnv } from "@autumn/shared";

const isProtectedRoute = createRouteMatcher([
  "/",
  "/(.*)",

  // "(.*)/features/(.*)",

  // "/admin(.*)",

  // "/workflow/(.*)",
  // "/cli-auth",
  // "/credits(.*)",
  // "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("path", path);
  requestHeaders.set("origin", req.nextUrl.origin);

  if (path === "/") {
    return NextResponse.redirect(new URL("/customers", req.url));
  } else if (path === "/sandbox") {
    return NextResponse.redirect(new URL("/sandbox/customers", req.url));
  }

  if (path.startsWith("/sandbox")) {
    const newPath = path.replace("/sandbox", "");
    requestHeaders.set("env", AppEnv.Sandbox);
    return NextResponse.rewrite(new URL(newPath, req.url), {
      headers: requestHeaders,
    });
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  requestHeaders.set("env", AppEnv.Live);

  return NextResponse.next({
    headers: requestHeaders,
  });
});
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
