"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Loader2, Key, AlertCircle } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                value={email}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    Forgot your password?
                  </Link>
              </div>

              <Input
                id="password"
                type="password"
                placeholder="password"
                autoComplete="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  onClick={() => {
                    setRememberMe(!rememberMe);
                  }}
                />
                <Label htmlFor="remember">Remember me</Label>
              </div>

          

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
              type="submit"
              className="w-full"
              disabled={loading}
              onClick={async () => {
                setError("");
                
                if (!email || !password) {
                  setError("Please enter both email and password");
                  return;
                }

                try {
                  await signIn.email(
                  {
                      email,
                      password
                  },
                  {
                    onRequest: (ctx) => {
                      setLoading(true);
                    },
                    onResponse: (ctx) => {
                      setLoading(false);
                    },
                    onError: (ctx) => {
                      setError(ctx.error.message || "Login failed");
                      toast.error(ctx.error.message || "Login failed");
                    },
                    onSuccess: () => {
                      toast.success("Login successful!");
                      router.push("/dashboard");
                    },
                  },
                  );
                } catch (err: any) {
                  setError(err.message || "An unexpected error occurred");
                  setLoading(false);
                }
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <p> Login </p>
              )}
              </Button>

          


        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-center w-full">
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500 underline"
              >
                Sign up
              </Link>
            </p>
          </div>
          <div className="flex justify-center w-full border-t py-4">
            <p className="text-center text-xs text-neutral-500">
             built with{" "}
              <Link
                href="https://better-auth.com"
                className="underline"
                target="_blank"
              >
                <span className="dark:text-white/70 cursor-pointer">
									better-auth.
								</span>
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}