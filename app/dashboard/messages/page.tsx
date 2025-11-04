"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, Mail, Send, ArrowLeft, Search, Filter, CheckCircle2, AlertCircle, User, Calendar, Wifi, WifiOff, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import ContactProfileModal from "@/components/ContactProfileModal";

import CompactMessageComposer from "@/components/CompactMessageComposer";
import MessageContent from "@/components/MessageContent";
import { useMessages, useContacts, useSendMessage, useMessageSubscription } from "@/hooks/useMessages";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  socialHandles?: any;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  channel: string;
  direction: string;
  content: string;
  status: string;
  timestamp: string;
  contact?: Contact;
  scheduledAt?: string;
  scheduledMessageId?: string;
}

interface ContactThread {
  contact: Contact;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
  hasUnread: boolean;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // React Query hooks for data fetching
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useMessages();
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const sendMessageMutation = useSendMessage();
  const { addMessage } = useMessageSubscription();
  
  // WebSocket connection for real-time updates
  const { isConnected: wsConnected } = useWebSocket();
  
  // Local state
  const [contactThreads, setContactThreads] = useState<ContactThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ContactThread | null>(null);
  const [selectedContact, setSelectedContact] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messageChannel, setMessageChannel] = useState("SMS");
  
  // Ref for messages container to enable auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  // Contact profile modal
  const [showContactProfile, setShowContactProfile] = useState(false);
  
  // Auto-scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Show error toast if there are any fetch errors
  useEffect(() => {
    if (messagesError) {
      toast.error('Failed to fetch messages');
    }
  }, [messagesError]);

  // Group messages into contact threads whenever messages or contacts change
  useEffect(() => {
    if (messages.length > 0 && contacts.length > 0) {
      const threads = groupMessagesIntoThreads(messages, contacts);
      setContactThreads(threads);
    }
  }, [messages, contacts]);

  // Handle URL parameter to auto-select contact
  useEffect(() => {
    const contactIdFromUrl = searchParams.get('contact');
    console.log('🔗 URL contact parameter:', contactIdFromUrl);
    console.log('📊 Contacts loading:', contactsLoading, 'Contacts count:', contacts.length);
    console.log('� Contact threads count:', contactThreads.length);
    console.log('� All contacts:', contacts.map(c => ({ id: c.id, name: c.name })));
    
    if (contactIdFromUrl && !contactsLoading && contacts.length > 0) {
      console.log('� Processing URL contact parameter:', contactIdFromUrl);
      
      // Try to find existing thread for this contact
      const existingThread = contactThreads.find(
        thread => thread.contact.id === contactIdFromUrl
      );
      
      if (existingThread) {
        console.log('✅ Found existing thread for contact:', existingThread.contact.name);
        setSelectedThread(existingThread);
        setSelectedContact(contactIdFromUrl);
      } else {
        // Contact exists but no messages yet - create empty thread
        const contact = contacts.find(c => c.id === contactIdFromUrl);
        if (contact) {
          console.log('📝 Creating empty thread for contact:', contact.name);
          const emptyThread: ContactThread = {
            contact,
            messages: [],
            lastMessage: null as any,
            unreadCount: 0,
            hasUnread: false
          };
          setSelectedThread(emptyThread);
          setSelectedContact(contactIdFromUrl);
        } else {
          console.log('❌ Contact not found in contacts list:', contactIdFromUrl);
          console.log('❌ Available contact IDs:', contacts.map(c => c.id));
        }
      }
    }
  }, [searchParams, contactThreads, contacts, contactsLoading]);

  // Store selected contact ID to avoid dependency issues
  const selectedContactId = selectedThread?.contact.id;

  // Separate effect to update selected thread when threads change
  useEffect(() => {
    if (selectedContactId && contactThreads.length > 0) {
      const updatedThread = contactThreads.find(t => t.contact.id === selectedContactId);
      if (updatedThread) {
        setSelectedThread(updatedThread);
      }
    }
  }, [contactThreads, selectedContactId]);

  // Auto-scroll when entering a chat or when messages change
  useEffect(() => {
    if (selectedThread) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedThread?.contact.id]); // Scroll when selecting a different thread

  // Auto-scroll when new messages are added to the current thread
  useEffect(() => {
    if (selectedThread && selectedThread.messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedThread?.messages.length]);

  const groupMessagesIntoThreads = (messages: Message[], contacts: Contact[]): ContactThread[] => {
    const contactMap = new Map(contacts.map(c => [c.id, c]));
    const threadsMap = new Map<string, ContactThread>();

    // First, process messages to create threads for contacts with messages
    messages.forEach(message => {
      if (!message.contact) return;
      
      const contactId = message.contact.id;
      const contact = contactMap.get(contactId) || message.contact;

      if (!threadsMap.has(contactId)) {
        threadsMap.set(contactId, {
          contact,
          messages: [],
          lastMessage: message,
          unreadCount: 0,
          hasUnread: false,
        });
      }

      const thread = threadsMap.get(contactId)!;
      thread.messages.push(message);

      // Update last message if this one is newer
      if (new Date(message.timestamp) > new Date(thread.lastMessage.timestamp)) {
        thread.lastMessage = message;
      }

      // Count unread messages (assuming INBOUND messages that are not DELIVERED are unread)
      if (message.direction === 'INBOUND' && message.status !== 'READ') {
        thread.unreadCount++;
        thread.hasUnread = true;
      }
    });

    // Add contacts without messages as empty threads
    contacts.forEach(contact => {
      if (!threadsMap.has(contact.id)) {
        threadsMap.set(contact.id, {
          contact,
          messages: [],
          lastMessage: null as any,
          unreadCount: 0,
          hasUnread: false,
        });
      }
    });

    const allThreads = Array.from(threadsMap.values());

    // Sort threads: first by whether they have messages (message threads first), 
    // then by last message timestamp for threads with messages,
    // then by contact name for threads without messages
    return allThreads.sort((a, b) => {
      const aHasMessages = a.messages.length > 0;
      const bHasMessages = b.messages.length > 0;

      if (aHasMessages && !bHasMessages) return -1;
      if (!aHasMessages && bHasMessages) return 1;

      if (aHasMessages && bHasMessages) {
        return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
      }

      // Both have no messages, sort by contact name
      return a.contact.name.localeCompare(b.contact.name);
    });
  };

  const getFilteredThreads = () => {
    return contactThreads.filter(thread => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const contactMatch = thread.contact.name.toLowerCase().includes(query) ||
                           thread.contact.phone?.includes(query) ||
                           thread.contact.email?.toLowerCase().includes(query);
        const messageMatch = thread.messages.some(msg => 
          msg.content.toLowerCase().includes(query)
        );
        if (!contactMatch && !messageMatch) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "unread" && !thread.hasUnread) return false;
        if (statusFilter === "read" && thread.hasUnread) return false;
      }

      // Channel filter
      if (channelFilter !== "all") {
        const hasChannel = thread.messages.some(msg => msg.channel === channelFilter);
        if (!hasChannel) return false;
      }

      return true;
    });
  };

  const sendMessage = async (contactId?: string, content?: string, channel?: string) => {
    // Use provided parameters or fall back to state
    const actualContactId = contactId || selectedContact;
    const actualContent = content || messageContent;
    const actualChannel = channel || messageChannel;

    if (!actualContactId || !actualContent.trim()) {
      toast.error("Please select a contact and enter a message");
      return;
    }

    // Use the React Query mutation for optimistic updates
    sendMessageMutation.mutate({
      contactId: actualContactId,
      content: actualContent,
      channel: actualChannel,
    });

    // Clear the message content after sending
    setMessageContent("");
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS': return <Phone className="h-4 w-4" />;
      case 'WHATSAPP': return <MessageSquare className="h-4 w-4" />;
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'SMS': return 'bg-green-100 text-green-800';
      case 'WHATSAPP': return 'bg-green-100 text-green-800';
      case 'EMAIL': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                ← Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Unified Inbox</h1>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-3">
              {/* WebSocket connection indicator */}
              <div className="flex items-center gap-2">
                {wsConnected ? (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <Wifi className="h-4 w-4" />
                    <span>Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <WifiOff className="h-4 w-4" />
                    <span>Disconnected</span>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Inbox Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden border-l border-r border-b border-gray-200">
        {/* Left Sidebar - Contact Threads */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Threads Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Conversations ({getFilteredThreads().length})
              </h2>
              <Button 
                size="sm"
                onClick={() => router.push('/dashboard/contacts')}
              >
                New Chat
              </Button>
            </div>
          </div>

          {/* Loading state - only show loading if contacts are still loading */}
          {contactsLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-4">
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Phone className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-yellow-800 mb-1">
                      No contacts found
                    </h3>
                    <p className="text-sm text-yellow-700 mb-3">
                      Add contacts to start conversations
                    </p>
                    <Button 
                      onClick={() => router.push('/dashboard/contacts')}
                      size="sm"
                    >
                      Add Your First Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Thread List */
            <div className="flex-1 overflow-y-auto">
              {getFilteredThreads().length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No conversations match your filters</p>
                </div>
              ) : (
                getFilteredThreads().map((thread) => (
                  <div
                    key={thread.contact.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedThread?.contact.id === thread.contact.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {thread.contact.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Thread Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-medium truncate ${
                              thread.hasUnread ? 'font-semibold text-gray-900' : 'text-gray-900'
                            }`}>
                              {thread.contact.name}
                            </h3>
                            <div className="flex items-center space-x-1">
                              {thread.hasUnread && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <span className="text-xs text-gray-500">
                                {thread.lastMessage ? 
                                  new Date(thread.lastMessage.timestamp).toLocaleDateString() : 
                                  'No messages yet'
                                }
                              </span>
                            </div>
                          </div>

                          {/* Channel badges */}
                          <div className="flex items-center gap-1 mb-2">
                            {thread.messages.length > 0 ? (
                              Array.from(new Set(thread.messages.map(m => m.channel))).map(channel => (
                                <Badge key={channel} className={`${getChannelColor(channel)} text-xs`}>
                                  {getChannelIcon(channel)}
                                  <span className="ml-1">{channel}</span>
                                </Badge>
                              ))
                            ) : (
                              <Badge className="bg-gray-100 text-gray-600 text-xs">
                                <User className="h-3 w-3" />
                                <span className="ml-1">New Contact</span>
                              </Badge>
                            )}
                          </div>

                          {/* Last message preview */}
                          <div className={`text-sm truncate ${
                            thread.hasUnread ? 'font-medium text-gray-800' : 'text-gray-600'
                          }`}>
                            {thread.lastMessage ? (
                              <>
                                {thread.lastMessage.direction === 'OUTBOUND' ? 'You: ' : ''}
                                <MessageContent 
                                  content={thread.lastMessage.content} 
                                  className="inline truncate"
                                />
                              </>
                            ) : (
                              <span className="text-gray-400 italic">Click to start conversation</span>
                            )}
                          </div>
                          
                          {/* Scheduled message indicator */}
                          {thread.lastMessage && thread.lastMessage.status === 'SCHEDULED' && (
                            <div className="mt-1">
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border border-blue-200/50 shadow-sm">
                                <Calendar className="h-3 w-3" />
                                <span>Scheduled</span>
                                <span className="text-blue-600">•</span>
                                {(() => {
                                  const scheduledDate = new Date(thread.lastMessage.scheduledAt || thread.lastMessage.timestamp);
                                  const now = new Date();
                                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                  const scheduledDateOnly = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
                                  
                                  if (scheduledDateOnly.getTime() === today.getTime()) {
                                    return `Today ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                  } else {
                                    return `${scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                  }
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Status indicators */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-1">
                              {thread.lastMessage && thread.lastMessage.status === 'DELIVERED' && (
                                <>
                                  <Check className="h-3 w-3 text-green-500" />
                                  <span className="text-xs text-gray-500">DELIVERED</span>
                                </>
                              )}
                              {thread.lastMessage && thread.lastMessage.status === 'SENT' && (
                                <>
                                  <Check className="h-3 w-3 text-green-500" />
                                  <span className="text-xs text-gray-500">SENT</span>
                                </>
                              )}
                              {thread.lastMessage && thread.lastMessage.status === 'FAILED' && (
                                <>
                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                  <span className="text-xs text-gray-500">FAILED</span>
                                </>
                              )}
                              {/* For scheduled messages, the pill above shows the info, so just show empty space */}
                            </div>
                            
                            {thread.unreadCount > 0 && (
                              <Badge variant="default" className="bg-blue-500 text-white">
                                {thread.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Side - Conversation View */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              {/* Conversation Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedThread.contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedThread.contact.name}</h2>
                      <p className="text-sm text-gray-500">
                        {selectedThread.contact.phone} • {selectedThread.contact.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowContactProfile(true)}
                    >
                      <User className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                    {selectedThread.hasUnread && (
                      <Badge className="bg-blue-500 text-white">
                        {selectedThread.unreadCount} unread
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedThread.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No messages yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Start a conversation with {selectedThread.contact.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      Use the message composer below to send your first message
                    </p>
                  </div>
                ) : (
                  selectedThread.messages
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((message) => (
                    <div key={message.id} className={`flex ${
                      message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                    }`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.direction === 'OUTBOUND'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={`${getChannelColor(message.channel)} text-xs`}>
                            {getChannelIcon(message.channel)}
                            <span className="ml-1">{message.channel}</span>
                          </Badge>
                          {message.status === 'SCHEDULED' && (
                            <div className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                              message.direction === 'OUTBOUND' 
                                ? 'bg-blue-600/20 text-blue-100 border border-blue-400/30' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              <Calendar className="h-3 w-3" />
                              {(() => {
                                const scheduledDate = new Date(message.scheduledAt || message.timestamp);
                                const now = new Date();
                                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
                                const scheduledDateOnly = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
                                
                                if (scheduledDateOnly.getTime() === today.getTime()) {
                                  return `Today ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                } else if (scheduledDateOnly.getTime() === tomorrow.getTime()) {
                                  return `Tomorrow ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                } else {
                                  return `${scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                        <MessageContent 
                          content={message.content} 
                          className="text-sm"
                        />
                        <div className="flex items-center justify-between mt-1 gap-1">
                          <p className={`text-xs ${
                            message.direction === 'OUTBOUND' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.status === 'SCHEDULED' 
                              ? `Scheduled`
                              : new Date(message.timestamp).toLocaleString()}
                          </p>
                          {message.direction === 'OUTBOUND' && (
                            <div className="flex items-center space-x-1 ml-1">
                              {message.status === 'DELIVERED' && (
                                <Check className="h-3 w-3 text-green-300" />
                              )}
                              {message.status === 'SENT' && (
                                <Check className="h-3 w-3 text-green-300" />
                              )}
                              {message.status === 'FAILED' && (
                                <AlertCircle className="h-3 w-3 text-red-300" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {/* Scroll target for auto-scroll to bottom */}
                <div ref={messagesEndRef} />
              </div>

              {/* Compact Message Composer */}
              <CompactMessageComposer
                onSendMessage={async (content: string, channel?: string) => {
                  // Update state for UI consistency
                  setMessageContent(content);
                  setMessageChannel(channel || 'SMS');
                  setSelectedContact(selectedThread.contact.id);
                  
                  // Pass values directly to avoid async state issues
                  await sendMessage(selectedThread.contact.id, content, channel || 'SMS');
                }}
                onScheduleMessage={async (content: string, scheduledAt: Date, channel: string) => {
                  try {
                    console.log('📅 Scheduling message:', { 
                      contactId: selectedThread.contact.id, 
                      content, 
                      channel, 
                      scheduledAt: scheduledAt.toISOString() 
                    });
                    
                    // First, schedule the message in the database
                    const response = await fetch('/api/messages/schedule', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        contactId: selectedThread.contact.id,
                        content,
                        channel,
                        scheduledAt: scheduledAt.toISOString(),
                      }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                      console.error('❌ Schedule API error:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData
                      });
                      throw new Error(errorData.error || `Failed to schedule message: ${response.status} ${response.statusText}`);
                    }

                    const result = await response.json();
                    console.log('✅ Schedule API success:', result);
                    
                    // Create the scheduled message object
                    const scheduledMessage = {
                      id: `scheduled-${result.id || Date.now()}`,
                      content,
                      channel,
                      direction: 'OUTBOUND' as const,
                      status: 'SCHEDULED',
                      contactId: selectedThread.contact.id,
                      timestamp: scheduledAt.toISOString(), // Use scheduled time as timestamp for proper ordering
                      scheduledAt: scheduledAt.toISOString(),
                      scheduledMessageId: result.id,
                      contact: selectedThread.contact,
                    };
                    
                    console.log('📅 Adding scheduled message to chat:', scheduledMessage);
                    
                    // Add to global messages via React Query
                    addMessage(scheduledMessage);
                    
                    // Immediately update the current thread to show the scheduled message
                    setContactThreads(prevThreads => 
                      prevThreads.map(thread => {
                        if (thread.contact.id === selectedThread.contact.id) {
                          const updatedMessages = [...thread.messages, scheduledMessage];
                          console.log('📅 Updated thread messages count:', updatedMessages.length);
                          return {
                            ...thread,
                            messages: updatedMessages,
                            lastMessage: scheduledMessage,
                          };
                        }
                        return thread;
                      })
                    );
                    
                    // Update the selected thread
                    if (selectedThread) {
                      setSelectedThread(prev => {
                        if (prev) {
                          const updatedThread = {
                            ...prev,
                            messages: [...prev.messages, scheduledMessage],
                            lastMessage: scheduledMessage,
                          };
                          console.log('📅 Updated selected thread messages count:', updatedThread.messages.length);
                          return updatedThread;
                        }
                        return null;
                      });
                    }
                    
                    toast.success(`Message scheduled for ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
                  } catch (error) {
                    console.error('Error scheduling message:', error);
                    toast.error('Failed to schedule message');
                    throw error; // Re-throw so the component can handle it
                  }
                }}
                disabled={sendMessageMutation.isPending}
                contactName={selectedThread.contact.name}
                contactId={selectedThread.contact.id}
                defaultChannel={messageChannel}
                showScheduling={true}
                showTemplates={true}
                showRichText={false} // Keep simple for SMS
              />
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Select a conversation</h2>
                <p className="text-gray-500">Choose a contact from the left to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </main>

      {/* Contact Profile Modal */}
      {selectedThread && (
        <ContactProfileModal
          contact={selectedThread.contact}
          open={showContactProfile}
          onOpenChange={setShowContactProfile}
        />
      )}


    </div>
  );
}
