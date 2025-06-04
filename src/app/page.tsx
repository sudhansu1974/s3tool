'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (login(password)) {
      document.cookie = 'auth=true; path=/';
      router.push('/query');
    } else {
      toast.error('Invalid password');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-indigo-100/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <Toaster position="top-center" />
      <div className="w-full max-w-[400px] px-6 -mt-32 relative">
        <div className="absolute inset-0 -m-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg blur-2xl opacity-10" />
        <Card className="border-indigo-100 relative backdrop-blur-sm bg-white/80">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center bg-gradient-to-br from-indigo-600 to-indigo-800 bg-clip-text text-transparent font-semibold">
              Welcome back!
            </CardTitle>
            <CardDescription className="text-center text-indigo-600/80">
              Enter your password to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-indigo-900">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="border-indigo-200 focus:ring-indigo-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md"
              >
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}