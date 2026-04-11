// Copyright 2025 promptLM
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Textarea } from '@promptlm/ui';
import { cn } from '@/lib/utils';
import type { Placeholder, PlaceholderConfig } from './PlaceholderManager';

interface PlaceholderHighlightProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  testId?: string;
  config: PlaceholderConfig;
  placeholders: Placeholder[];
  onPlaceholderClick?: (name: string) => void;
}

export function PlaceholderHighlight({
  value,
  onChange,
  placeholder,
  className,
  testId,
  config,
  placeholders,
  onPlaceholderClick,
}: PlaceholderHighlightProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [setScrollTop] = useState(0);

  const regex = useMemo(() => {
    const escapedOpen = config.openSequence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedClose = config.closeSequence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(${escapedOpen}\\w+${escapedClose})`, 'g');
  }, [config]);

  const highlightedContent = useMemo(() => {
    if (!value) return null;

    const parts = value.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        const nameMatch = part.match(new RegExp(`${config.openSequence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\w+)${config.closeSequence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
        const name = nameMatch?.[1];
        const isDefined = placeholders.some(p => p.name === name);
        
        return (
          <span
            key={index}
            className={cn(
              "rounded px-0.5 cursor-pointer transition-colors",
              isDefined 
                ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30" 
                : "bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30"
            )}
            onClick={() => name && onPlaceholderClick?.(name)}
            title={isDefined ? `Defined: ${name}` : `Undefined: ${name}`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }, [value, regex, placeholders, config, onPlaceholderClick]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      setScrollTop(textareaRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', handleScroll);
      return () => textarea.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return (
    <div className="relative">
      {/* Highlighted overlay */}
      <div
        ref={overlayRef}
        className={cn(
          "absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words font-mono text-sm p-3",
          "text-foreground",
          className
        )}
        style={{ paddingRight: '1.5rem' }}
        aria-hidden="true"
      >
        {highlightedContent}
      </div>
      
      {/* Actual textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className={cn(
          "bg-transparent font-mono text-sm resize-none relative z-10",
          "[&]:caret-foreground",
          className
        )}
        style={{
          WebkitTextFillColor: value ? 'transparent' : undefined,
        }}
      />
    </div>
  );
}

// Simple inline badge for showing placeholder status
export function PlaceholderBadge({ 
  name, 
  isDefined, 
  onClick 
}: { 
  name: string; 
  isDefined: boolean; 
  onClick?: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono cursor-pointer transition-colors",
        isDefined
          ? "bg-primary/20 text-primary hover:bg-primary/30"
          : "bg-warning/20 text-warning hover:bg-warning/30"
      )}
      onClick={onClick}
    >
      {name}
    </span>
  );
}
