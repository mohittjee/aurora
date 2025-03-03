import { ReactNode } from "react";
import AuthButton from "@/components/AuthButton";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex justify-between items-center p-4 bg-white shadow">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <AuthButton />
      </header>
      {children}
    </div>
  );
}