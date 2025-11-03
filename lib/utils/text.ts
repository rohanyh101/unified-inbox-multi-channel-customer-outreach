/**
 * Utility functions for handling rich text content
 */

/**
 * Converts HTML content to plain text for SMS/WhatsApp sending
 * This strips HTML tags and converts some formatting to text equivalents
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  // Handle common HTML elements with text equivalents
  const text = html
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    
    // Convert emphasis to text
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '*$1*')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '*$1*')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_')
    
    // Convert lists
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '')
    
    // Convert headings
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1\n')
    
    // Convert blockquotes
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
    
    // Remove all other HTML tags
    .replace(/<[^>]*>/g, '')
    
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
    
  return text;
}

/**
 * Checks if content contains HTML tags
 */
export function isHtmlContent(content: string): boolean {
  return /<[^>]+>/.test(content);
}

/**
 * Sanitizes HTML content for safe display
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, consider using a library like DOMPurify
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
}
