"use client";

import { useUser, SignOutButton, SignInButton } from "@clerk/nextjs"; // Clerk hooks
import { Button } from "@/components/ui/button";

export default function AuthButton() {
  const { isSignedIn } = useUser(); // Clerk's useUser hook

  return (
    <Button
      variant="outline"
      className="border-blue-600 text-blue-600 hover:bg-blue-50"
    >
      {isSignedIn ? <SignOutButton>Logout</SignOutButton> : <SignInButton>Login</SignInButton>}
    </Button>
  );
}