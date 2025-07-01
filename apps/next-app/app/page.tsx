"use client"

// React
import { useEffect } from 'react';

// Next.js
import { redirect } from 'next/navigation';

// UI Components
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

// Custom Hooks
import { useSession } from "@/lib/hooks/useSession";

// Lucide Icons
import { LoaderCircleIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

export default function Home() {
  const { user, loading, error, signOut } = useSession();

  useEffect(() => {
    if (!loading && !user) {
      redirect('/sign-in');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircleIcon className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-8">
      <nav className="flex justify-between items-start mb-8">
        <h1 className="text-2xl font-medium">kleroteria</h1>
        <div className="flex gap-4 items-center">
          <ModeToggle />
        </div>
      </nav>

      <Card>
        <CardContent>
          <pre className="p-4 rounded-lg overflow-auto text-sm bg-muted border  ">
            {JSON.stringify(user, null, 2)}
          </pre>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </CardFooter>
      </Card>
    </div >
  );
}
