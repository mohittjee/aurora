"use client";

import { useUser, SignOutButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";

export default function AuthButton() {
  const { isSignedIn } = useUser();

  return (
    <div className="group flex items-center justify-center gap-1 rounded-md hover:cursor-pointer p-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:text-accent-foreground dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
      {isSignedIn ? <SignOutButton>Logout</SignOutButton> : <SignInButton>Let's Get In!</SignInButton>}
      <ArrowRightIcon
        className="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5"
        size={16}
        aria-hidden="true"
      />
    </div>
  );
}