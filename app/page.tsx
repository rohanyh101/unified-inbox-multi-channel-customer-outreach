"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && !isPending) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect to dashboard
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Unified Inbox</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Multi-Channel Customer 
            <span className="text-blue-600"> Outreach</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Manage SMS, WhatsApp, and email communications in one unified inbox. 
            Send messages, track responses, and analyze performance across all channels.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link href="/register">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/inbox">
              <Button variant="outline" size="lg">View Demo</Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need for customer outreach
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Unified Inbox</CardTitle>
                <CardDescription>
                  All your messages from SMS, WhatsApp, and email in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Threaded conversations by contact</li>
                  <li>• Real-time message synchronization</li>
                  <li>• Channel indicators and status</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Smart Contact Management</CardTitle>
                <CardDescription>
                  Organize and track all your customer interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Contact profiles with history</li>
                  <li>• Notes and tags</li>
                  <li>• Activity tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Track performance and optimize your outreach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Response time analytics</li>
                  <li>• Message volume by channel</li>
                  <li>• Delivery status tracking</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Integration Section */}
        <div className="mt-20 bg-blue-50 rounded-2xl p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powered by Twilio
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Reliable SMS and WhatsApp delivery with enterprise-grade infrastructure
            </p>
            <Link href="/settings">
              <Button>Configure Integration</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
