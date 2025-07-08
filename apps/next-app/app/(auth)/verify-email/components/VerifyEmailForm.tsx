"use client"

import React from "react";

// Utilities
import { cn } from "@/lib/clsx-handler";
import { api } from "@/lib/api-handler";

// Zod
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// React Hooks
import { useState } from "react";
import { useForm } from "react-hook-form";

// Next.js Hooks
import { useRouter } from "next/navigation";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from "@/components/ui/input-otp";

// Lucide Icons
import { LoaderCircle } from 'lucide-react';

const formSchema = z.object({
  code: z
    .string()
    .min(6, "Code must be 6 characters long")
    .max(6, "Code must be 6 characters long")
    .regex(/^[A-Za-z0-9]+$/, "Code must be alphanumeric")
});

export function VerifyEmailForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  // Set router
  const router = useRouter();

  // Set states
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { data, error } = await api.post('/api/users/verify-email-verification', {
        code: values.code
      });

      if (error) {
        console.error('Verify email verification code error:', error);
        return;
      }

      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmailVerificationCode = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await api.post('/api/users/resend-email-verification');

      if (error) {
        console.error('Resend email verification code error:', error);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props} suppressHydrationWarning>
      <div className="w-full max-w-md mx-auto flex flex-col gap-4">
        <div className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full hover:cursor-pointer"
                disabled={isLoading || form.watch("code").length !== 6}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Verifying email...
                  </>
                ) : (
                  "Verify email"
                )}
              </Button>
            </form>
          </Form>

          <div className="text-sm text-primary text-center">
            Didn't receive the code?{" "}
            <button
              onClick={resendEmailVerificationCode}
              disabled={isLoading}
              className="underline hover:cursor-pointer"
            >
              Resend code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
