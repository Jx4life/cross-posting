
import React from "react";
import { Textarea } from "../ui/textarea";

interface ContentEditorProps {
  content: string;
  setContent: (content: string) => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  setContent
}) => {
  const maxLength = 280; // Twitter character limit
  const remainingChars = maxLength - content.length;
  const isOverLimit = remainingChars < 0;
  
  return (
    <div className="relative">
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={`min-h-[120px] md:min-h-[150px] bg-white/10 border-purple-500/20 text-gray-900 placeholder:text-gray-500 ${
          isOverLimit ? 'border-red-500' : ''
        }`}
        style={{ 
          caretColor: 'black'
        }}
      />
      
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
