"use client"

// app/(auth)/sign-up/page.tsx

// React
import { useEffect } from 'react';

// Next.js
import { redirect } from 'next/navigation';

// UI Components
import { SignUpForm } from "./components/SignUpForm";

// Custom Hooks
import { useSession } from "@/lib/hooks/useSession";

// Lucide Icons
import { LoaderCircleIcon } from 'lucide-react';

export default function SignUpPage() {
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
        <SignUpForm />
      </div>
    </div>
  );
}