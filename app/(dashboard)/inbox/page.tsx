"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Phone, Mail, Search, Send, Plus } from 'lucide-react'

// Mock data for demonstration
const mockContacts = [
  {
    id: '1',
    name: 'John Doe',
    phone: '+1234567890',
    lastMessage: 'Thanks for the quick response!',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    unreadCount: 2,
    channel: 'SMS' as const,
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '+1987654321',
    lastMessage: 'When can we schedule a call?',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    unreadCount: 0,
    channel: 'WHATSAPP' as const,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    lastMessage: 'I have a question about the pricing',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 1,
    channel: 'EMAIL' as const,
  },
]

const mockMessages = [
  {
    id: '1',
    content: 'Hi there! I saw your product demo and I\'m interested.',
    direction: 'INBOUND' as const,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    channel: 'SMS' as const,
  },
  {
    id: '2',
    content: 'Thanks for reaching out! I\'d be happy to help you learn more.',
    direction: 'OUTBOUND' as const,
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    channel: 'SMS' as const,
  },
  {
    id: '3',
    content: 'Thanks for the quick response!',
    direction: 'INBOUND' as const,
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    channel: 'SMS' as const,
  },
]

function ChannelBadge({ channel }: { channel: string }) {
  const getIcon = () => {
    switch (channel) {
      case 'SMS':
        return <MessageSquare className="w-3 h-3" />
      case 'WHATSAPP':
        return <Phone className="w-3 h-3" />
      case 'EMAIL':
        return <Mail className="w-3 h-3" />
      default:
        return <MessageSquare className="w-3 h-3" />
    }
  }

  const getColor = () => {
    switch (channel) {
      case 'SMS':
        return 'bg-blue-100 text-blue-800'
      case 'WHATSAPP':
        return 'bg-green-100 text-green-800'
      case 'EMAIL':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getColor()}`}>
      {getIcon()}
      {channel}
    </span>
  )
}

function formatTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60 * 1000) {
    return 'Just now'
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}m ago`
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}h ago`
  } else {
    return date.toLocaleDateString()
  }
}

export default function InboxPage() {
  const [selectedContact, setSelectedContact] = useState(mockContacts[0])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.phone && contact.phone.includes(searchTerm)) ||
    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    
    // TODO: Implement actual message sending
    console.log('Sending message:', message)
    setMessage('')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Contact List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Contact
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedContact.id === contact.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{contact.name}</h3>
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={contact.channel} />
                  {contact.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
              <p className="text-xs text-gray-500 mt-1">{formatTime(contact.timestamp)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Messages */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedContact.name}</h2>
                  <p className="text-sm text-gray-600">
                    {selectedContact.phone || selectedContact.email}
                  </p>
                </div>
                <ChannelBadge channel={selectedContact.channel} />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mockMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.direction === 'OUTBOUND'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.direction === 'OUTBOUND' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={`Send a message via ${selectedContact.channel}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button type="submit" disabled={!message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a contact from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
