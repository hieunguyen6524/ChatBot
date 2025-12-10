import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Regular expression to match URLs in text
 * Matches http, https, and www URLs
 */
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

/**
 * Extract a readable label from a URL
 * For Outlook links, returns "Link họp"
 * For other links, returns the domain name
 */
function getUrlLabel(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('www.') ? `https://${url}` : url);
    const hostname = urlObj.hostname;
    
    // Special case for Outlook meeting links
    if (hostname.includes('outlook.office365.com') || hostname.includes('outlook.live.com')) {
      if (url.includes('/calendar/') || url.includes('itemid=')) {
        return 'Mở lịch họp';
      }
      return 'Outlook';
    }
    
    // Special case for Teams meeting links
    if (hostname.includes('teams.microsoft.com')) {
      return 'Mở Teams';
    }
    
    // Special case for Google Meet
    if (hostname.includes('meet.google.com')) {
      return 'Mở Google Meet';
    }
    
    // Special case for Zoom
    if (hostname.includes('zoom.us')) {
      return 'Mở Zoom';
    }
    
    // Default: return cleaned domain name
    return hostname.replace('www.', '');
  } catch {
    // If URL parsing fails, return a generic label
    return 'Mở link';
  }
}

/**
 * Parse text and convert URLs to clickable links
 * @param text - The text content that may contain URLs
 * @param isUserMessage - Whether this is a user message (affects styling)
 * @returns React elements with URLs converted to styled anchor tags
 */
export function linkify(
  text: string,
  isUserMessage: boolean = false
): React.ReactNode[] {
  const parts = text.split(URL_REGEX);
  
  return parts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      // Reset regex lastIndex since we're reusing it
      URL_REGEX.lastIndex = 0;
      
      // Add https:// prefix for www URLs
      const href = part.startsWith('www.') ? `https://${part}` : part;
      const label = getUrlLabel(part);
      
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium transition-all ${
            isUserMessage 
              ? 'bg-white/20 hover:bg-white/30 text-white' 
              : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400'
          }`}
          onClick={(e) => e.stopPropagation()}
          title={part}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {label}
        </a>
      );
    }
    return part;
  });
}

/**
 * Component wrapper for linkify function
 */
interface LinkifyTextProps {
  text: string;
  isUserMessage?: boolean;
}

export const LinkifyText: React.FC<LinkifyTextProps> = ({ text, isUserMessage = false }) => {
  return <>{linkify(text, isUserMessage)}</>;
};
