"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Users, 
  Shield, 
  Eye, 
  Edit, 
  Crown,
  MessageSquare,
  Contact,
  StickyNote
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  email: string
  name: string
  role: 'VIEWER' | 'EDITOR' | 'ADMIN'
  createdAt: string
  updatedAt: string
  _count: {
    contacts: number
    messages: number
    notes: number
  }
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else if (response.status === 403) {
        toast.error("You don't have admin permissions")
      } else {
        toast.error("Failed to fetch users")
      }
    } catch (error) {
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: data.user.role, updatedAt: data.user.updatedAt } : user
        ))
        toast.success(`User role updated to ${newRole}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update user role")
      }
    } catch (error) {
      toast.error("Failed to update user role")
    } finally {
      setUpdating(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="h-4 w-4" />
      case 'EDITOR': return <Edit className="h-4 w-4" />
      case 'VIEWER': return <Eye className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'EDITOR': return 'bg-blue-100 text-blue-800'
      case 'VIEWER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Full access - can manage users and all features'
      case 'EDITOR': return 'Can create and edit messages, notes, and contacts'
      case 'VIEWER': return 'Read-only access - can view but not modify data'
      default: return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => window.history.back()} 
                  className="flex items-center gap-2"
                >
                  ← Back to Dashboard
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()} 
                className="flex items-center gap-2"
              >
                ← Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Description */}
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-lg text-gray-600">
              Manage user roles and permissions across your unified inbox platform
            </p>
          </div>

          {/* Role Permissions Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-gray-600" />
                  Viewer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {getRoleDescription('VIEWER')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    View contacts and messages
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Read notes and comments
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Cannot create or edit
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-600" />
                  Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {getRoleDescription('EDITOR')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    All viewer permissions
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Create/edit notes
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Send messages
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-red-600" />
                  Admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {getRoleDescription('ADMIN')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    All editor permissions
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Manage user roles
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Access admin features
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user.name?.charAt(0) || user.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name || 'Unnamed User'}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRoleColor(user.role)} flex items-center gap-1 w-fit`}>
                            {getRoleIcon(user.role)}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Contact className="h-3 w-3" />
                              {user._count.contacts}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {user._count.messages}
                            </div>
                            <div className="flex items-center gap-1">
                              <StickyNote className="h-3 w-3" />
                              {user._count.notes}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => updateUserRole(user.id, value)}
                            disabled={updating === user.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VIEWER">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Viewer
                                </div>
                              </SelectItem>
                              <SelectItem value="EDITOR">
                                <div className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  Editor
                                </div>
                              </SelectItem>
                              <SelectItem value="ADMIN">
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4" />
                                  Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {users.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                  <p className="text-gray-500">There are no users in the system yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
