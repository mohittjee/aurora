"use client";

import { useUser, SignOutButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function AuthButton() {
  const { isSignedIn } = useUser();

  return (
    <Button
      variant="outline"
      className="border-blue-600 text-blue-600 hover:bg-blue-50"
      asChild
    >
      {isSignedIn ? <SignOutButton>Logout</SignOutButton> : <SignInButton>Login</SignInButton>}
    </Button>
  );
}