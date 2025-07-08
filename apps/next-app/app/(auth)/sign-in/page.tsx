"use client"

// app/(auth)/sign-in/page.tsx

// React
import { useEffect } from 'react';

// Next.js
import { redirect } from 'next/navigation';

// UI Components
import { SignInForm } from "./components/SignInForm";

// Custom Hooks
import { useSession } from "@/lib/hooks/useSession";

// Lucide Icons
import { LoaderCircleIcon, LogInIcon } from 'lucide-react';

export default function SignInPage() {
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && user) {
      redirect('/');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircleIcon className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="mx-auto max-w-md w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <div className="flex items-center justify-center w-12 h-12">
              <LogInIcon className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-medium text-foreground">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Sign in to your account to continue where you left off
          </p>
        </div>

        <SignInForm />
      </div>
    </div>
  );
}