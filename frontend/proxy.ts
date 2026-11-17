import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAgentMarkdownResponse } from "./lib/agent-content.mjs";
import { createContentSecurityPolicy } from "./lib/security-policy.mjs";

function addAcceptVaryHeader(response: NextResponse): void {
  const varyValues = response.headers
    .get("Vary")
    ?.split(",")
    .map((value) => value.trim()) ?? [];

  if (!varyValues.some((value) => value.toLowerCase() === "accept")) {
    varyValues.push("Accept");
    response.headers.set("Vary", varyValues.join(", "));
  }
}

export function proxy(request: NextRequest): NextResponse | Response {
  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(randomUUID()).toString("base64");
  const configuredApiUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3000";
  const apiOrigin = new URL(configuredApiUrl).origin;
  const contentSecurityPolicy = createContentSecurityPolicy(
    nonce,
    apiOrigin,
    process.env.NODE_ENV === "development",
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const markdownResponse = createAgentMarkdownResponse(
    pathname,
    request.method,
    request.headers.get("accept"),
  );
  if (markdownResponse) {
    markdownResponse.headers.set(
      "Content-Security-Policy",
      contentSecurityPolicy,
    );
    return markdownResponse;
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  if (pathname === "/") addAcceptVaryHeader(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
