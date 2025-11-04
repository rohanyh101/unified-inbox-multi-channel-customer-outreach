"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import { 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  StickyNote, 
  Calendar, 
  Send,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import { toast } from "sonner"
import CollaborativeNotes from "./CollaborativeNotes"

interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
  socialHandles?: any
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
  direction: 'INBOUND' | 'OUTBOUND'
  content: string
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ'
  timestamp: string
  mediaUrl?: string
}



interface ContactProfileModalProps {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ContactProfileModal({ contact, open, onOpenChange }: ContactProfileModalProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (contact && open) {
      fetchCurrentUser()
    }
  }, [contact, open])

  const fetchCurrentUser = async () => {
    try {
      // For now, we'll use a mock user. In a real app, you'd fetch from an auth endpoint
      setCurrentUser({
        id: 'current-user',
        name: 'Current User',
        email: 'user@example.com',
        role: 'EDITOR'
      })
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'READ':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'SENT':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getChannelBadge = (channel: string) => {
    const colors = {
      SMS: 'bg-blue-100 text-blue-800',
      WHATSAPP: 'bg-green-100 text-green-800',
      EMAIL: 'bg-purple-100 text-purple-800'
    }
    return (
      <Badge className={`${colors[channel as keyof typeof colors]} text-xs`}>
        {channel}
      </Badge>
    )
  }

  if (!contact) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[70vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold">{contact.name}</h3>
              <p className="text-sm text-gray-500 font-normal">
                Contact since {new Date(contact.createdAt).toLocaleDateString()}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {/* Contact Details */}
          <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 break-all">{contact.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Updated {new Date(contact.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Team Notes Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <StickyNote className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Team Notes</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {currentUser && (
                <CollaborativeNotes 
                  contactId={contact.id} 
                  currentUser={currentUser}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
