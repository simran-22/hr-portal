import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const protectedRoutes = ["/dashboard", "/employees", "/attendance", "/leaves", "/payroll", "/recruitment", "/performance", "/settings"];
const publicRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtected = protectedRoutes.some((r) => path.startsWith(r));
  const isPublic = publicRoutes.includes(path);

  const token = request.cookies.get("hr_session")?.value;
  const session = token ? await decrypt(token) : null;

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isPublic && session) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
