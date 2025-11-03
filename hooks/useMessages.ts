import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
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
  contactId: string;
  scheduledAt?: string;
  scheduledMessageId?: string;
}

interface SendMessageRequest {
  contactId: string;
  content: string;
  channel: string;
  mediaUrl?: string;
}

// API functions
const fetchMessages = async (): Promise<Message[]> => {
  const response = await fetch('/api/messages');
  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const fetchContacts = async (): Promise<Contact[]> => {
  const response = await fetch('/api/contacts');
  if (!response.ok) {
    throw new Error(`Failed to fetch contacts: ${response.statusText}`);
  }
  const data = await response.json();
  return data.contacts || [];
};

const sendMessage = async (messageData: SendMessageRequest): Promise<Message> => {
  const response = await fetch('/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'Failed to send message');
  }
  
  const result = await response.json();
  return result.message;
};

// Custom hooks
export const useMessages = () => {
  return useQuery({
    queryKey: ['messages'],
    queryFn: fetchMessages,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });
};

export const useContacts = () => {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 5 * 60 * 1000, // 5 minutes - contacts don't change often
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages'] });
      
      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages']);
      
      // Optimistically update to the new value
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        contactId: newMessage.contactId,
        content: newMessage.content,
        channel: newMessage.channel,
        direction: 'OUTBOUND',
        status: 'PENDING',
        timestamp: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Message[]>(['messages'], (old = []) => [
        ...old,
        optimisticMessage,
      ]);
      
      return { previousMessages, optimisticMessage };
    },
    onSuccess: (data, variables, context) => {
      // Replace the optimistic update with the real message
      queryClient.setQueryData<Message[]>(['messages'], (old = []) => 
        old.map(msg => 
          msg.id === context?.optimisticMessage.id ? data : msg
        )
      );
      
      toast.success(`${variables.channel} message sent successfully!`);
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages'], context.previousMessages);
      }
      
      toast.error(error.message || 'Failed to send message');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};

// Hook for real-time message updates
export const useMessageSubscription = () => {
  const queryClient = useQueryClient();
  
  const addMessage = (message: Message) => {
    queryClient.setQueryData<Message[]>(['messages'], (old = []) => {
      // Check if message already exists to prevent duplicates
      const exists = old.some(m => m.id === message.id);
      if (exists) return old;
      
      return [...old, message];
    });
  };
  
  const updateMessageStatus = (messageId: string, status: string) => {
    queryClient.setQueryData<Message[]>(['messages'], (old = []) => {
      if (status === 'REMOVE') {
        // Remove the message entirely
        return old.filter(msg => msg.id !== messageId);
      }
      // Update the message status
      return old.map(msg => {
        if (msg.id === messageId) {
          const updatedMsg = { ...msg, status };
          
          // If transitioning from SCHEDULED to SENT, clean up scheduled metadata
          if (msg.status === 'SCHEDULED' && status === 'SENT') {
            console.log('📨 Transitioning scheduled message to sent:', messageId);
            delete updatedMsg.scheduledAt;
            delete updatedMsg.scheduledMessageId;
            // Update timestamp to when it was actually sent
            updatedMsg.timestamp = new Date().toISOString();
          }
          
          return updatedMsg;
        }
        return msg;
      });
    });
  };
  
  return { addMessage, updateMessageStatus };
};
