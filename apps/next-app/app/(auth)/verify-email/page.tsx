'use client';

// Utilities
import { api } from '@/lib/api-handler';

// React Hooks
import { useEffect, useState } from 'react';

// Next.js
import { redirect } from 'next/navigation';

// Custom Hooks
import { useSession } from '@/lib/hooks/useSession';

// `VerifyEmailForm` Component
import { VerifyEmailForm } from './components/VerifyEmailForm';

// Lucide Icons
import { LoaderCircleIcon, MailIcon } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, loading } = useSession();

  // Set states
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      redirect('/sign-in');
    }

    if (user.emailVerified) {
      redirect('/');
    }

    console.log(user);

    const sendVerificationCode = async () => {
      // Create cookie for last sent timestamp
      const lastSentKey = `verification_sent_${user.id}`;
      const lastSent = sessionStorage.getItem(lastSentKey);
      const now = Date.now();

      if (lastSent && (now - parseInt(lastSent)) < 2 * 60 * 1000) {
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await api.post('/api/users/send-email-verification');

        if (error) {
          console.error('Error sending email verification:', error);
          return;
        }

        sessionStorage.setItem(lastSentKey, now.toString());
      } finally {
        setLoading(false);
      }
    };

    sendVerificationCode();
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircleIcon className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="mx-auto max-w-md w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <div className="flex items-center justify-center w-12 h-12">
              <MailIcon className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-medium text-foreground">
            Verify your email
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            We've sent a verification code to <span className="text-primary">{(user as any).data.user.email}</span>, so check your inbox and enter the code below.
          </p>
        </div>

        <VerifyEmailForm />
      </div>
    </div>
  );
}