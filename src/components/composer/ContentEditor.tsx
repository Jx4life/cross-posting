
import React, { useEffect, useState } from "react";
import { Textarea } from "../ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";

interface ContentEditorProps {
  content: string;
  setContent: (content: string) => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  setContent
}) => {
  const [highlightedContent, setHighlightedContent] = useState<React.ReactNode>(null);
  const isMobile = useIsMobile();
  
  // Highlight hashtags in content
  useEffect(() => {
    if (!content) {
      setHighlightedContent(null);
      return;
    }

    // Regex to find hashtags
    const hashtagRegex = /(^|\s)(#[a-zA-Z0-9_]+)/g;
    
    // Split content by hashtags and create an array of elements
    const parts = content.split(hashtagRegex);
    
    const formattedContent = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part && part.startsWith('#')) {
        // If it's a hashtag, add it with a special class
        formattedContent.push(
          <span key={i} className="text-blue-500 font-semibold">
            {part}
          </span>
        );
      } else if (part) {
        // Otherwise, just add the text
        formattedContent.push(<span key={i}>{part}</span>);
      }
    }
    
    setHighlightedContent(<>{formattedContent}</>);
  }, [content]);
  
  const maxLength = 280; // Twitter character limit
  const remainingChars = maxLength - content.length;
  const isOverLimit = remainingChars < 0;
  
  return (
    <div className="relative">
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={`min-h-[120px] md:min-h-[150px] bg-white/10 border-purple-500/20 ${
          isOverLimit ? 'border-red-500' : ''
        } ${highlightedContent ? 'text-transparent caret-white' : ''}`}
        style={highlightedContent ? { caretColor: 'white' } : {}}
      />
      
      {highlightedContent && (
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none p-3 overflow-auto text-white whitespace-pre-wrap break-words">
          {highlightedContent}
        </div>
      )}
      
      <div className={`text-xs md:text-sm mt-1 ${
        isOverLimit ? 'text-red-400' : 
        remainingChars <= 20 ? 'text-yellow-400' : 
        'text-gray-400'
      }`}>
        {remainingChars} characters remaining
      </div>
    </div>
  );
};
