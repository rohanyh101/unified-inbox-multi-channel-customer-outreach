"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Clock, 
  Send, 
  Calendar, 
  Plus,
  Phone,
  MessageSquare,
  Mail,
  Trash2,
  Edit3
} from "lucide-react"
import { toast } from "sonner"

interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
}

interface ScheduledMessage {
  id: string
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL'
  content: string
  scheduledAt: string
  status: 'PENDING' | 'SENT' | 'CANCELLED' | 'FAILED'
  createdAt: string
  contact: Contact
}

interface MessageSchedulerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: Contact[]
  selectedContactId?: string
  onScheduled?: () => void
}

const QUICK_TEMPLATES = [
  { label: "In 1 hour", hours: 1 },
  { label: "Tomorrow 9 AM", hours: 24, setTime: "09:00" },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
]

const FOLLOW_UP_TEMPLATES = [
  { label: "Follow-up check-in", content: "Hi {name}, just following up on our previous conversation. How are things going?" },
  { label: "Appointment reminder", content: "Hi {name}, this is a reminder about your appointment scheduled for tomorrow. Looking forward to seeing you!" },
  { label: "Payment reminder", content: "Hi {name}, this is a friendly reminder about the pending payment. Please let us know if you have any questions." },
  { label: "Thank you message", content: "Hi {name}, thank you for your business! We appreciate your trust in our services." },
  { label: "Birthday wishes", content: "Happy Birthday {name}! 🎉 Wishing you a wonderful year ahead!" },
  { label: "Custom message", content: "" },
]

export default function MessageSchedulerModal({ 
  open, 
  onOpenChange, 
  contacts, 
  selectedContactId,
  onScheduled 
}: MessageSchedulerModalProps) {
  const [selectedContact, setSelectedContact] = useState(selectedContactId || "")
  const [messageChannel, setMessageChannel] = useState<'SMS' | 'WHATSAPP' | 'EMAIL'>('SMS')
  const [messageContent, setMessageContent] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  
  // Scheduling state
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Scheduled messages list
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    if (selectedContactId) {
      setSelectedContact(selectedContactId)
    }
  }, [selectedContactId])

  useEffect(() => {
    if (open) {
      fetchScheduledMessages()
      // Set default date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setScheduledDate(tomorrow.toISOString().split('T')[0])
      setScheduledTime("09:00")
    }
  }, [open])

  const fetchScheduledMessages = async () => {
    setLoadingMessages(true)
    try {
      const response = await fetch('/api/messages/scheduled')
      if (response.ok) {
        const data = await response.json()
        setScheduledMessages(data.scheduledMessages || [])
      }
    } catch (error) {
      console.error('Failed to fetch scheduled messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const applyQuickTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    const now = new Date()
    
    if (template.hours) {
      now.setHours(now.getHours() + template.hours)
      if (template.setTime) {
        const [hours, minutes] = template.setTime.split(':')
        now.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      }
    }
    
    if (template.days) {
      now.setDate(now.getDate() + template.days)
    }
    
    setScheduledDate(now.toISOString().split('T')[0])
    setScheduledTime(now.toTimeString().slice(0, 5))
  }

  const applyMessageTemplate = (template: typeof FOLLOW_UP_TEMPLATES[0]) => {
    setSelectedTemplate(template.label)
    if (template.content) {
      const contact = contacts.find(c => c.id === selectedContact)
      const personalizedContent = template.content.replace('{name}', contact?.name || 'there')
      setMessageContent(personalizedContent)
    }
  }

  const scheduleMessage = async () => {
    if (!selectedContact || !messageContent.trim() || !scheduledDate || !scheduledTime) {
      toast.error("Please fill in all required fields")
      return
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
    if (scheduledDateTime <= new Date()) {
      toast.error("Scheduled time must be in the future")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/messages/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedContact,
          content: messageContent.trim(),
          channel: messageChannel,
          scheduledAt: scheduledDateTime.toISOString()
        })
      })

      if (response.ok) {
        toast.success("Message scheduled successfully!")
        setMessageContent("")
        setSelectedTemplate("")
        fetchScheduledMessages()
        onScheduled?.()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to schedule message")
      }
    } catch (error) {
      toast.error("Failed to schedule message")
    } finally {
      setLoading(false)
    }
  }

  const cancelScheduledMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/scheduled/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Scheduled message cancelled")
        fetchScheduledMessages()
      } else {
        toast.error("Failed to cancel message")
      }
    } catch (error) {
      toast.error("Failed to cancel message")
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS': return <Phone className="h-4 w-4" />
      case 'WHATSAPP': return <MessageSquare className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'SMS': return 'bg-blue-100 text-blue-800'
      case 'WHATSAPP': return 'bg-green-100 text-green-800'
      case 'EMAIL': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'SENT': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const selectedContactObj = contacts.find(c => c.id === selectedContact)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Message Scheduler</h2>
              <p className="text-sm text-gray-500 font-normal mt-1">Schedule messages for future delivery</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6 flex-1 min-h-0">
          {/* Schedule New Message Section */}
          <div className="space-y-6 overflow-y-scroll pr-2 max-h-[70vh] scrollbar-thin bg-white/30 border border-blue-200/50 rounded-lg p-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
              <h3 className="text-lg font-semibold mb-6 text-gray-800 flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                Schedule New Message
              </h3>
              
              {/* Recipient & Channel Section */}
              <div className="bg-white/50 rounded-lg p-4 mb-8 border border-blue-100/50">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Recipient & Channel</h4>
                
                {/* Contact Selection */}
                <div className="space-y-4 mb-6">
                  <Label className="text-sm font-medium text-gray-700">Select Contact</Label>
                <Select value={selectedContact} onValueChange={setSelectedContact}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose a contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        <div className="flex items-center gap-3 py-1">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium">{contact.name}</span>
                            {contact.phone && (
                              <p className="text-xs text-gray-500">{contact.phone}</p>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>                {/* Channel Selection */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">Channel</Label>
                <Select value={messageChannel} onValueChange={(value: 'SMS' | 'WHATSAPP' | 'EMAIL') => setMessageChannel(value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMS">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Phone className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium">SMS</span>
                          <p className="text-xs text-gray-500">Text message</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="WHATSAPP">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <span className="font-medium">WhatsApp</span>
                          <p className="text-xs text-gray-500">WhatsApp message</p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                </div>
              </div>

              {/* Scheduling Options Section */}
              <div className="bg-white/50 rounded-lg p-4 mb-8 border border-blue-100/50">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">When to Send</h4>
                 {/* Quick Time Templates */}
                <div className="space-y-4 mb-6">
                  <Label className="text-sm font-medium text-gray-700">Quick Schedule</Label>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_TEMPLATES.map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => applyQuickTemplate(template)}
                      className="text-xs h-9 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <Clock className="h-3 w-3 mr-2" />
                      {template.label}
                    </Button>
                  ))}
                </div>
              </div>                {/* Date & Time */}
                <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Time</Label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full pr-4"
                        style={{ 
                          paddingRight: '2.5rem'
                        }}
                      />
                    </div>
                  </div>
                </div>
                {scheduledDate && scheduledTime && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                    📅 Scheduled for: <strong>{new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}</strong>
                  </div>
                )}
              </div>
              </div>

              {/* Message Content Section */}
              <div className="bg-white/50 rounded-lg p-4 mb-8 border border-blue-100/50">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Message Content</h4>
                 {/* Message Templates */}
                <div className="space-y-4 mb-6">
                  <Label className="text-sm font-medium text-gray-700">Message Templates</Label>
                <Select value={selectedTemplate} onValueChange={(value) => {
                  const template = FOLLOW_UP_TEMPLATES.find(t => t.label === value)
                  if (template) applyMessageTemplate(template)
                }}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOW_UP_TEMPLATES.map((template) => (
                      <SelectItem key={template.label} value={template.label}>
                        <div className="py-1">
                          <span className="font-medium">{template.label}</span>
                          {template.content && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {template.content.substring(0, 50)}...
                            </p>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>                {/* Message Content */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">Message</Label>
                <Textarea
                  placeholder="Type your message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={`${messageContent.length > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                    {messageContent.length}/160 characters
                  </span>
                  {selectedContactObj && (
                    <span className="text-gray-500">
                      📨 Will be sent to <strong>{selectedContactObj.name}</strong>
                    </span>
                  )}
                </div>
              </div>
              </div>

              {/* Preview */}
              {messageContent && scheduledDate && scheduledTime && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-5 mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-white" />
                    </div>
                    <Label className="text-sm font-semibold text-green-800">Message Preview</Label>
                  </div>
                  <div className="bg-white rounded-lg p-3 space-y-2 text-sm border">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">To:</span>
                      <span className="font-medium">{selectedContactObj?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Channel:</span>
                      <Badge className={`${getChannelColor(messageChannel)} text-xs`}>
                        {getChannelIcon(messageChannel)}
                        <span className="ml-1">{messageChannel}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">When:</span>
                      <span className="font-medium">{new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <span className="text-gray-600 text-xs">Message:</span>
                      <p className="bg-gray-50 p-2 rounded mt-1 text-gray-800">"{messageContent}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Button */}
              <Button
                onClick={scheduleMessage}
                disabled={loading || !selectedContact || !messageContent.trim() || !scheduledDate || !scheduledTime}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 mr-2" />
                )}
                {loading ? "Scheduling..." : "Schedule Message"}
              </Button>
            </div>
          </div>

          {/* Scheduled Messages Section */}
          <div className="flex flex-col">
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  Scheduled Messages
                </h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {scheduledMessages.filter(m => m.status === 'PENDING').length} pending
                </Badge>
              </div>

              <div className="overflow-y-scroll space-y-4 pr-2 max-h-[60vh] scrollbar-thin bg-white/50 border border-slate-200 rounded-lg p-3">
              {loadingMessages ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : scheduledMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-gray-700 mb-2">No scheduled messages</h4>
                  <p className="text-sm text-gray-500">Messages you schedule will appear here</p>
                </div>
              ) : (
                scheduledMessages.map((message) => (
                  <div key={message.id} className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                          {message.contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{message.contact.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${getChannelColor(message.channel)} text-xs`}>
                              {getChannelIcon(message.channel)}
                              <span className="ml-1">{message.channel}</span>
                            </Badge>
                            <Badge className={`${getStatusColor(message.status)} text-xs font-medium`}>
                              {message.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {message.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelScheduledMessage(message.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{message.content}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded">
                        <Calendar className="h-3 w-3 text-blue-600" />
                        <span className="font-medium">{new Date(message.scheduledAt).toLocaleString()}</span>
                      </div>
                      <span>Created {new Date(message.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
