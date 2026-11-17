import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  acceptsMarkdown,
  homepageMarkdown,
  isKnownAppPath,
  notFoundMarkdown,
} from "./lib/agent-content.mjs";

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
  const wantsMarkdown = acceptsMarkdown(request.headers.get("accept"));

  if (wantsMarkdown && pathname === "/") {
    return new Response(request.method === "HEAD" ? null : homepageMarkdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
      },
    });
  }

  if (wantsMarkdown && !isKnownAppPath(pathname)) {
    return new Response(request.method === "HEAD" ? null : notFoundMarkdown, {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
      },
    });
  }

  const response = NextResponse.next();
  if (pathname === "/") addAcceptVaryHeader(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
