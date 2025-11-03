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
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes'>('timeline')
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Quick action state
  const [quickMessage, setQuickMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (contact && open) {
      fetchContactHistory()
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

  const fetchContactHistory = async () => {
    if (!contact) return
    
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/messages?contactId=${contact.id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch contact history:', error)
      toast.error('Failed to load message history')
    } finally {
      setLoadingMessages(false)
    }
  }



  const sendQuickMessage = async (channel: 'SMS' | 'WHATSAPP') => {
    if (!contact || !quickMessage.trim()) return
    
    setSendingMessage(true)
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          content: quickMessage.trim(),
          channel
        })
      })

      if (response.ok) {
        toast.success(`${channel} message sent successfully!`)
        setQuickMessage('')
        fetchContactHistory()
      } else {
        const error = await response.json()
        toast.error(error.message || `Failed to send ${channel} message`)
      }
    } catch (error) {
      toast.error(`Failed to send ${channel} message`)
    } finally {
      setSendingMessage(false)
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

          {/* Quick Actions */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Quick Actions</Label>
            <div className="flex gap-2 mb-3">
              {contact.phone && (
                <>
                  <Button
                    size="sm"
                    onClick={() => sendQuickMessage('SMS')}
                    disabled={!quickMessage.trim() || sendingMessage}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send SMS
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendQuickMessage('WHATSAPP')}
                    disabled={!quickMessage.trim() || sendingMessage}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send WhatsApp
                  </Button>
                </>
              )}
            </div>
            <Textarea
              placeholder="Type a quick message..."
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              rows={2}
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('timeline')}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Message History
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('notes')}
            >
              <StickyNote className="h-4 w-4 inline mr-2" />
              Team Notes
            </button>
          </div>

          {/* Tab Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {loadingMessages ? (
                  <div className="text-center py-8 text-gray-500">Loading message history...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.direction === 'OUTBOUND'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getChannelBadge(message.channel)}
                          {getStatusIcon(message.status)}
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.direction === 'OUTBOUND' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'notes' && currentUser && (
              <CollaborativeNotes 
                contactId={contact.id} 
                currentUser={currentUser}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
