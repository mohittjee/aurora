import { NextRequest, NextResponse } from "next/server";
import { signOut } from "next-auth/react";

export async function GET(req: NextRequest) {
  try {
    // signOut is client-side, so redirect to client-side logout for now
    return NextResponse.redirect("/?logout=true");
  } catch (error: any) {
    console.error("Logout Error:", error);
    return NextResponse.json({ error: error.message || "Failed to logout" }, { status: 500 });
  }
}