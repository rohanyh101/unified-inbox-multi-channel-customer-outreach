"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  MessageCircle, 
  Reply, 
  AtSign, 
  Eye, 
  EyeOff, 
  Send,
  Trash2,
  MoreVertical,
  UserCheck,
  Clock
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  name: string
  email: string
  role: 'VIEWER' | 'EDITOR' | 'ADMIN'
}

interface Mention {
  id: string
  user: User
}

interface Note {
  id: string
  content: string
  isPrivate: boolean
  createdAt: string
  updatedAt: string
  author: User
  mentions: Mention[]
  _count: {
    replies: number
  }
}

interface Reply extends Note {
  parentId: string
}

interface CollaborativeNotesProps {
  contactId: string
  currentUser: User
}

export default function CollaborativeNotes({ contactId, currentUser }: CollaborativeNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [replies, setReplies] = useState<Record<string, Reply[]>>({})
  const [newNote, setNewNote] = useState("")
  const [replyContent, setReplyContent] = useState<Record<string, string>>({})
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedMentions, setSelectedMentions] = useState<string[]>([])
  const [activePresence, setActivePresence] = useState<any[]>([])
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchNotes()
    fetchAvailableUsers()
    
    // Set up presence tracking
    updatePresence('viewing_contact')
    
    // Poll for presence updates every 10 seconds
    const presenceInterval = setInterval(() => {
      fetchPresence()
    }, 10000)

    return () => {
      clearInterval(presenceInterval)
      updatePresence('offline')
    }
  }, [contactId])

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes)
      }
    } catch (error) {
      toast.error("Failed to fetch notes")
    }
  }

  const fetchReplies = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/replies`)
      if (response.ok) {
        const data = await response.json()
        setReplies(prev => ({ ...prev, [noteId]: data.replies }))
      }
    } catch (error) {
      toast.error("Failed to fetch replies")
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`/api/mentions?query=${mentionQuery}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users")
    }
  }

  const fetchPresence = async () => {
    try {
      const response = await fetch(`/api/presence?contactId=${contactId}`)
      if (response.ok) {
        const data = await response.json()
        setActivePresence(data.presence)
      }
    } catch (error) {
      console.error("Failed to fetch presence")
    }
  }

  const updatePresence = async (action: string, metadata?: any) => {
    try {
      await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          action,
          metadata,
        }),
      })
    } catch (error) {
      console.error("Failed to update presence")
    }
  }

  const createNote = async () => {
    if (!newNote.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNote,
          isPrivate,
          mentions: selectedMentions,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNotes(prev => [data.note, ...prev])
        setNewNote("")
        setSelectedMentions([])
        setIsPrivate(false)
        toast.success("Note created successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create note")
      }
    } catch (error) {
      toast.error("Failed to create note")
    } finally {
      setLoading(false)
    }
  }

  const createReply = async (noteId: string) => {
    const content = replyContent[noteId]
    if (!content?.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/notes/${noteId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          isPrivate: false,
          mentions: selectedMentions,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setReplies(prev => ({
          ...prev,
          [noteId]: [...(prev[noteId] || []), data.reply]
        }))
        setReplyContent(prev => ({ ...prev, [noteId]: "" }))
        setSelectedMentions([])
        toast.success("Reply added successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create reply")
      }
    } catch (error) {
      toast.error("Failed to create reply")
    } finally {
      setLoading(false)
    }
  }

  const toggleReplies = async (noteId: string) => {
    if (expandedNotes.has(noteId)) {
      setExpandedNotes(prev => {
        const newSet = new Set(prev)
        newSet.delete(noteId)
        return newSet
      })
    } else {
      setExpandedNotes(prev => new Set([...prev, noteId]))
      if (!replies[noteId]) {
        await fetchReplies(noteId)
      }
    }
  }

  const handleMentionSelect = (userId: string) => {
    setSelectedMentions(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
    setShowMentions(false)
  }

  const parseMentions = (content: string) => {
    // Simple mention parsing - in a real app you'd want more sophisticated parsing
    return content.replace(/@(\w+)/g, '<span class="mention">@$1</span>')
  }

  const canEdit = currentUser.role !== 'VIEWER'

  return (
    <div className="space-y-4">
      {/* Active Users Presence Indicator */}
      {activePresence.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <UserCheck className="h-4 w-4" />
              <span>
                {activePresence.map(p => p.user.name).join(", ")} 
                {activePresence.length === 1 ? " is" : " are"} currently viewing this contact
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Note Form */}
      {canEdit && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Note</h3>
              <div className="flex items-center gap-2">
                <Popover open={showMentions} onOpenChange={setShowMentions}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <AtSign className="h-4 w-4 mr-1" />
                      Mention ({selectedMentions.length})
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <h4 className="font-medium">Mention Users</h4>
                      {availableUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleMentionSelect(user.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {user.name?.charAt(0) || user.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium">{user.name || user.email}</div>
                              <div className="text-xs text-gray-500">{user.role}</div>
                            </div>
                          </div>
                          {selectedMentions.includes(user.id) && (
                            <Badge variant="secondary">Selected</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant={isPrivate ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setIsPrivate(!isPrivate)}
                >
                  {isPrivate ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {isPrivate ? "Private" : "Public"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              ref={textareaRef}
              placeholder="Add a note about this contact..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onFocus={() => updatePresence('editing_note', { type: 'new_note' })}
              className="min-h-[80px] mb-3"
            />
            
            {selectedMentions.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {selectedMentions.map(userId => {
                  const user = availableUsers.find(u => u.id === userId)
                  return user ? (
                    <Badge key={userId} variant="secondary">
                      @{user.name || user.email}
                    </Badge>
                  ) : null
                })}
              </div>
            )}
            
            <Button onClick={createNote} disabled={loading || !newNote.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={note.id} className={note.isPrivate ? "border-orange-200 bg-orange-50/50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {note.author.name?.charAt(0) || note.author.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{note.author.name || note.author.email}</span>
                      <Badge variant="outline" className="text-xs">
                        {note.author.role}
                      </Badge>
                      {note.isPrivate && (
                        <Badge variant="secondary" className="text-xs">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {canEdit && (
                      <DropdownMenuItem>
                        <Reply className="h-4 w-4 mr-2" />
                        Reply
                      </DropdownMenuItem>
                    )}
                    {(note.author.id === currentUser.id || currentUser.role === 'ADMIN') && (
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent>
              <div 
                className="text-sm text-gray-700 mb-3"
                dangerouslySetInnerHTML={{ __html: parseMentions(note.content) }}
              />
              
              {note.mentions.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.mentions.map((mention) => (
                    <Badge key={mention.id} variant="outline" className="text-xs">
                      <AtSign className="h-3 w-3 mr-1" />
                      {mention.user.name || mention.user.email}
                    </Badge>
                  ))}
                </div>
              )}
              
              {note._count.replies > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReplies(note.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {expandedNotes.has(note.id) ? "Hide" : "Show"} Replies ({note._count.replies})
                  </Button>
                </div>
              )}
              
              {/* Replies */}
              {expandedNotes.has(note.id) && replies[note.id] && (
                <div className="ml-4 border-l-2 border-gray-200 pl-4 space-y-3">
                  {replies[note.id].map((reply) => (
                    <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {reply.author.name?.charAt(0) || reply.author.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{reply.author.name || reply.author.email}</span>
                            <Badge variant="outline" className="text-xs">
                              {reply.author.role}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: parseMentions(reply.content) }}
                      />
                      {reply.mentions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {reply.mentions.map((mention) => (
                            <Badge key={mention.id} variant="outline" className="text-xs">
                              <AtSign className="h-3 w-3 mr-1" />
                              {mention.user.name || mention.user.email}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Reply Form */}
                  {canEdit && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyContent[note.id] || ""}
                        onChange={(e) => setReplyContent(prev => ({ ...prev, [note.id]: e.target.value }))}
                        onFocus={() => updatePresence('editing_note', { type: 'reply', noteId: note.id })}
                        className="min-h-[60px]"
                      />
                      <Button
                        size="sm"
                        onClick={() => createReply(note.id)}
                        disabled={loading || !replyContent[note.id]?.trim()}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
