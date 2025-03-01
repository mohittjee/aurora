"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui

export default function AuthButton() {
  const { data: session } = useSession();

  return (
    <Button
      variant="outline"
      onClick={() => (session ? signOut() : signIn("google"))} // Default to Google for simplicity
      className="border-blue-600 text-blue-600 hover:bg-blue-50"
    >
      {session ? "Logout" : "Login"}
    </Button>
  );
}