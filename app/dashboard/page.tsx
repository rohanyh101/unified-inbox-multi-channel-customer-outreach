"use client";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Users, Calendar, BarChart3, Shield } from "lucide-react";

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Unified Inbox</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user?.name || session.user?.email}
              </span>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                  router.push("/login");
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user?.name || 'User'}!
          </h2>
          <p className="text-gray-600">
            Manage your communications from one unified inbox.
          </p>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Messages */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/messages")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-blue-600" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Send and manage SMS, WhatsApp, and email messages from your unified inbox.
              </p>
              <Button className="w-full">
                Open Inbox
              </Button>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/contacts")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-green-600" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage your contact list and organize your communication network.
              </p>
              <Button variant="outline" className="w-full">
                Manage Contacts
              </Button>
            </CardContent>
          </Card>

          {/* Scheduled Messages */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-orange-600" />
                Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Schedule messages to be sent automatically at specific times.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push("/dashboard/messages")}
              >
                View Scheduled
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Analytics */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/analytics")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View message delivery rates, response analytics, and communication insights.
              </p>
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Admin Panel */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/admin")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-red-600" />
                Admin Panel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage system settings, user permissions, and application configuration.
              </p>
              <Button variant="outline" className="w-full">
                Admin Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
