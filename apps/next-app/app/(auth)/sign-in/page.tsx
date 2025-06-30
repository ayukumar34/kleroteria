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
import { LoaderCircleIcon } from 'lucide-react';

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
        <LoaderCircleIcon className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="mx-auto max-w-md w-full px-4 py-12 sm:px-6 lg:px-8">
        <SignInForm />
      </div>
    </div>
  );
}