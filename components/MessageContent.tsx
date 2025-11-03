import React from 'react';
import { isHtmlContent, sanitizeHtml } from '@/lib/utils/text';

interface MessageContentProps {
  content: string;
  className?: string;
}

/**
 * Component to safely render message content
 * - Displays HTML as rendered content if it contains HTML tags
 * - Displays plain text as-is if no HTML tags
 */
const MessageContent: React.FC<MessageContentProps> = ({ 
  content, 
  className = "" 
}) => {
  // Check if content contains HTML
  if (isHtmlContent(content)) {
    // Sanitize and render HTML
    const sanitized = sanitizeHtml(content);
    
    return (
      <div 
        className={`message-content ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitized }}
        style={{
          // Basic styling for rendered HTML content
          lineHeight: '1.4',
        }}
      />
    );
  }
  
  // Render plain text with preserved line breaks
  return (
    <p className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {content}
    </p>
  );
};

export default MessageContent;
