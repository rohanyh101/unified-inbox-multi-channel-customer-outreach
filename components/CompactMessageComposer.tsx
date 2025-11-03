import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Send,
  FileText,
  Type,
  Calendar,
  Smile,
  Phone,
  MessageSquare,
  ChevronDown,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import RichTextEditor from './RichTextEditor';
import MediaAttachmentComponent from './MediaAttachment';
import MessageTemplates from './MessageTemplates';

interface MediaAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  createdAt: string;
  usageCount: number;
}

interface EnhancedMessageComposerProps {
  onSendMessage: (content: string, attachments?: MediaAttachment[], channel?: string) => Promise<void>;
  onScheduleMessage?: (content: string, scheduledAt: Date, channel: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  showScheduling?: boolean;
  showTemplates?: boolean;
  showRichText?: boolean;
  contactName?: string;
  contactId?: string;
  defaultChannel?: string;
}

const EnhancedMessageComposer: React.FC<EnhancedMessageComposerProps> = ({
  onSendMessage,
  onScheduleMessage,
  placeholder = "Type your message...",
  disabled = false,
  showScheduling = true,
  showTemplates = true,
  showRichText = false,
  contactName,
  contactId,
  defaultChannel = "SMS"
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isRichTextMode, setIsRichTextMode] = useState(showRichText);
  const [isSending, setIsSending] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(defaultChannel);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) {
      toast.error('Please enter a message or attach a file');
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(message, attachments, selectedChannel);
      setMessage('');
      setAttachments([]);
      toast.success(`${selectedChannel} message sent successfully`);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message to schedule');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select both date and time');
      return;
    }

    setIsScheduling(true);
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      // Use the callback prop if provided, otherwise fall back to API call
      if (onScheduleMessage) {
        await onScheduleMessage(message, scheduledDateTime, selectedChannel);
      } else {
        // Fallback to direct API call
        if (!contactId) {
          toast.error('No contact selected');
          return;
        }
        
        const response = await fetch('/api/messages/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactId,
            content: message,
            channel: selectedChannel,
            scheduledAt: scheduledDateTime.toISOString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Schedule API error:', response.status, errorData);
          throw new Error(`Failed to schedule message: ${response.status} ${errorData}`);
        }
      }

      // Clear form
      setMessage('');
      setScheduledDate('');
      setScheduledTime('');
      setShowScheduleModal(false);
      
      toast.success(`Message scheduled for ${scheduledDateTime.toLocaleString()}`);
    } catch (error) {
      console.error('Error scheduling message:', error);
      toast.error('Failed to schedule message');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    let content = template.content;
    
    // Replace variables with actual values or placeholders
    if (contactName && template.variables.includes('name')) {
      content = content.replace(/\{\{name\}\}/g, contactName);
    }
    
    if (template.variables.includes('date')) {
      const today = new Date().toLocaleDateString();
      content = content.replace(/\{\{date\}\}/g, today);
    }
    
    if (template.variables.includes('time')) {
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      content = content.replace(/\{\{time\}\}/g, currentTime);
    }

    setMessage(content);
    setShowTemplatesModal(false);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + text + message.substring(end);
      setMessage(newMessage);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    } else {
      setMessage(message + text);
    }
  };

  const getCharacterCount = () => {
    const plainText = isRichTextMode 
      ? message.replace(/<[^>]*>/g, '') // Strip HTML tags for rich text
      : message;
    return plainText.length;
  };

  const characterCount = getCharacterCount();
  const isSMSLength = characterCount <= 160;

  return (
    <div className="space-y-3 p-4 bg-white border-t">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SMS">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  SMS
                </div>
              </SelectItem>
              <SelectItem value="WHATSAPP">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" />
                  WhatsApp
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Status Indicator */}
          <div className="text-xs text-gray-500">
            {characterCount} chars
            {selectedChannel === 'SMS' && !isRichTextMode && (
              <span className={`ml-2 ${characterCount > 160 ? 'text-orange-600' : ''}`}>
                ({isSMSLength ? '1' : Math.ceil(characterCount / 160)} SMS)
              </span>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          {showTemplates && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTemplatesModal(true)}
              disabled={disabled}
              className="h-7 w-7 p-0"
              title="Templates"
            >
              <FileText className="h-3 w-3" />
            </Button>
          )}
          

          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRichTextMode(!isRichTextMode)}
            disabled={disabled}
            className={`h-7 w-7 p-0 ${isRichTextMode ? 'bg-blue-100' : ''}`}
            title={isRichTextMode ? 'Plain text' : 'Rich text'}
          >
            <Type className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Message Input */}
      <div className="relative">
        {isRichTextMode ? (
          <RichTextEditor
            content={message}
            onChange={setMessage}
            placeholder={placeholder}
            className="min-h-[80px]"
          />
        ) : (
          <>
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              rows={3}
              disabled={disabled}
              className="resize-none pr-10 text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertAtCursor(' 😊')}
              disabled={disabled}
              className="absolute bottom-2 right-2 h-6 w-6 p-0"
              title="Add emoji"
            >
              <Smile className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      {/* Media Attachments - Compact */}
      {attachments.length > 0 && (
        <div className="max-h-32 overflow-y-auto">
          <MediaAttachmentComponent
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            maxFiles={3}
            maxFileSize={5}
            allowedTypes={['image/*', 'video/*', '.pdf', '.doc', '.docx']}
            showPreview={false}
          />
        </div>
      )}

      {/* Attachment Upload Area - Only show when no attachments */}
      {attachments.length === 0 && (
        <MediaAttachmentComponent
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          maxFiles={3}
          maxFileSize={5}
          allowedTypes={['image/*', 'video/*', '.pdf', '.doc', '.docx']}
        />
      )}

      {/* Send Button with Teams/Slack style dropdown */}
      <div className="flex justify-end">
        {showScheduling ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                disabled={disabled || isSending || isScheduling || (!message.trim() && attachments.length === 0)}
                size="sm"
                className="min-w-[100px] px-3"
              >
                {isSending ? (
                  'Sending...'
                ) : isScheduling ? (
                  'Scheduling...'
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-2" />
                    Send
                    <ChevronDown className="h-3 w-3 ml-2" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 !bg-white !border !border-gray-200 !shadow-lg !rounded-md !p-1 !z-50" style={{backgroundColor: '#ffffff', border: '1px solid #e5e7eb'}}>
              <DropdownMenuItem 
                onClick={handleSend} 
                disabled={disabled || isSending || isScheduling || (!message.trim() && attachments.length === 0)}
                className="cursor-pointer !hover:bg-gray-100 !focus:bg-gray-100 !px-3 !py-2 !text-gray-900 !bg-white rounded-sm"
                style={{backgroundColor: '#ffffff', color: '#111827'}}
              >
                <Send className="h-4 w-4 mr-3 text-blue-600" />
                Send now
              </DropdownMenuItem>
              <DropdownMenuSeparator className="!bg-gray-200 !h-px !my-1" style={{backgroundColor: '#e5e7eb'}} />
              <DropdownMenuItem 
                onClick={() => setShowScheduleModal(true)} 
                disabled={disabled || isSending || isScheduling || !message.trim()}
                className="cursor-pointer !hover:bg-gray-100 !focus:bg-gray-100 !px-3 !py-2 !text-gray-900 !bg-white rounded-sm"
                style={{backgroundColor: '#ffffff', color: '#111827'}}
              >
                <Clock className="h-4 w-4 mr-3 text-orange-600" />
                Schedule for later
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            onClick={handleSend}
            disabled={disabled || isSending || (!message.trim() && attachments.length === 0)}
            size="sm"
            className="min-w-[80px]"
          >
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <Send className="h-3 w-3 mr-2" />
                Send
              </>
            )}
          </Button>
        )}
      </div>

      {/* Templates Modal */}
      <Dialog open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Message Templates</DialogTitle>
            <DialogDescription>
              Select a template to use in your message.
            </DialogDescription>
          </DialogHeader>
          
          <MessageTemplates
            onTemplateSelect={handleTemplateSelect}
            showInsertButton={false}
          />
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Schedule Message
            </DialogTitle>
            <DialogDescription>
              Schedule this message to be sent to {contactName} at a specific time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Message Preview */}
            <div className="bg-gray-50 rounded-lg p-3 border">
              <Label className="text-sm font-medium text-gray-600">Message Preview:</Label>
              <p className="text-sm text-gray-800 mt-1 max-h-20 overflow-y-auto">
                {message || "No message entered"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge className={selectedChannel === 'SMS' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                  {selectedChannel === 'SMS' ? <Phone className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                  {selectedChannel}
                </Badge>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <Label htmlFor="schedule-date" className="text-sm font-medium">
                Date
              </Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>

            {/* Time Selection */}
            <div>
              <Label htmlFor="schedule-time" className="text-sm font-medium">
                Time
              </Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Scheduled DateTime Preview */}
            {scheduledDate && scheduledTime && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <Label className="text-sm font-medium text-blue-800">Will be sent:</Label>
                <p className="text-sm text-blue-700 font-medium">
                  {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowScheduleModal(false)}
              disabled={isScheduling}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSchedule}
              disabled={isScheduling || !message.trim() || !scheduledDate || !scheduledTime}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isScheduling ? (
                <>
                  <Calendar className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Message
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedMessageComposer;
