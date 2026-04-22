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

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@promptlm/ui';
import { Input } from '@promptlm/ui';
import { Label } from '@promptlm/ui';
import { Badge } from '@promptlm/ui';
import { Textarea } from '@promptlm/ui';
import { Plus, Trash2, Settings, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@promptlm/ui';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@promptlm/ui';

export interface Placeholder {
  id: string;
  name: string;
  description?: string;
  values: string[];
  currentValueIndex: number;
}

export interface PlaceholderConfig {
  openSequence: string;
  closeSequence: string;
}

interface PlaceholderManagerProps {
  placeholders: Placeholder[];
  config: PlaceholderConfig;
  onPlaceholdersChange: (placeholders: Placeholder[]) => void;
  onConfigChange: (config: PlaceholderConfig) => void;
  onInsertPlaceholder?: (name: string) => void;
}

export function PlaceholderManager({
  placeholders,
  config,
  onPlaceholdersChange,
  onConfigChange,
  onInsertPlaceholder,
}: PlaceholderManagerProps) {
  const [newPlaceholderName, setNewPlaceholderName] = useState('');
  const [editingPlaceholder, setEditingPlaceholder] = useState<Placeholder | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  const addPlaceholder = useCallback(() => {
    if (!newPlaceholderName.trim()) return;
    
    const sanitizedName = newPlaceholderName.trim().replace(/\s+/g, '_').toLowerCase();
    
    if (placeholders.some(p => p.name === sanitizedName)) return;
    
    const newPlaceholder: Placeholder = {
      id: crypto.randomUUID(),
      name: sanitizedName,
      values: [''],
      currentValueIndex: 0,
    };
    
    onPlaceholdersChange([...placeholders, newPlaceholder]);
    setNewPlaceholderName('');
  }, [newPlaceholderName, placeholders, onPlaceholdersChange]);

  const removePlaceholder = useCallback((id: string) => {
    onPlaceholdersChange(placeholders.filter(p => p.id !== id));
    if (editingPlaceholder?.id === id) {
      setEditingPlaceholder(null);
    }
  }, [placeholders, onPlaceholdersChange, editingPlaceholder]);

  const updatePlaceholder = useCallback((id: string, updates: Partial<Placeholder>) => {
    const singleValue = updates.values ? [updates.values[0] ?? ''] : undefined;
    onPlaceholdersChange(
      placeholders.map((placeholder) =>
        placeholder.id === id
          ? {
              ...placeholder,
              ...updates,
              values: singleValue ?? placeholder.values,
              currentValueIndex: 0,
            }
          : placeholder,
      )
    );
    if (editingPlaceholder?.id === id) {
      setEditingPlaceholder((previous) =>
        previous
          ? {
              ...previous,
              ...updates,
              values: singleValue ?? previous.values,
              currentValueIndex: 0,
            }
          : null,
      );
    }
  }, [placeholders, onPlaceholdersChange, editingPlaceholder]);

  const formatPlaceholder = useCallback((name: string) => {
    return `${config.openSequence}${name}${config.closeSequence}`;
  }, [config]);

  return (
    <div className="space-y-3">
      {/* Config Button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Use <code className="text-primary">{formatPlaceholder('name')}</code> syntax
        </p>
        <Popover open={configOpen} onOpenChange={setConfigOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" data-testid="placeholder-config-button">
              <Settings className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-popover" align="end">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Delimiter Config</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Open</Label>
                  <Input
                    value={config.openSequence}
                    onChange={(e) => onConfigChange({ ...config, openSequence: e.target.value })}
                    className="h-8 text-sm font-mono bg-secondary/30"
                    placeholder="{{"
                    data-testid="placeholder-open-sequence-input"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Close</Label>
                  <Input
                    value={config.closeSequence}
                    onChange={(e) => onConfigChange({ ...config, closeSequence: e.target.value })}
                    className="h-8 text-sm font-mono bg-secondary/30"
                    placeholder="}}"
                    data-testid="placeholder-close-sequence-input"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Preview: <code className="text-primary">{formatPlaceholder('example')}</code>
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Add Placeholder */}
      <div className="flex gap-2">
        <Input
          placeholder="placeholder_name"
          value={newPlaceholderName}
          onChange={(e) => setNewPlaceholderName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPlaceholder()}
          className="h-8 text-sm bg-secondary/30 font-mono"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0"
          onClick={addPlaceholder}
          disabled={!newPlaceholderName.trim()}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Placeholder List */}
      {placeholders.length > 0 ? (
        <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
          {placeholders.map((placeholder) => (
            <div
              key={placeholder.id}
              className="group flex items-center gap-2 p-2 rounded-md bg-secondary/20 border border-border hover:border-primary/30 transition-colors"
              data-testid={`placeholder-row-${placeholder.name}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code
                    className="text-xs text-primary cursor-pointer hover:underline truncate"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onInsertPlaceholder?.(placeholder.name);
                    }}
                    title="Click to insert"
                  >
                    {formatPlaceholder(placeholder.name)}
                  </code>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    1 value
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {placeholder.values[0] || '(empty)'}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setEditingPlaceholder(placeholder)}
                      data-testid={`placeholder-edit-${placeholder.name}`}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="sm:max-w-md bg-card"
                    aria-describedby={`${placeholder.id}-dialog-description`}
                  >
                    <DialogHeader>
                      <DialogTitle className="font-mono text-primary">
                        {formatPlaceholder(placeholder.name)}
                      </DialogTitle>
                      <DialogDescription id={`${placeholder.id}-dialog-description`}>
                        Manage values for this placeholder
                      </DialogDescription>
                    </DialogHeader>
                    <PlaceholderValueEditor
                      placeholder={placeholder}
                      onUpdateDescription={(desc) => updatePlaceholder(placeholder.id, { description: desc })}
                      onUpdateValue={(value) => updatePlaceholder(placeholder.id, { values: [value], currentValueIndex: 0 })}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => removePlaceholder(placeholder.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          No placeholders defined yet
        </p>
      )}
    </div>
  );
}

interface PlaceholderValueEditorProps {
  placeholder: Placeholder;
  onUpdateDescription: (description: string) => void;
  onUpdateValue: (value: string) => void;
}

function PlaceholderValueEditor({
  placeholder,
  onUpdateDescription,
  onUpdateValue,
}: PlaceholderValueEditorProps) {
  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="space-y-2">
        <Label className="text-xs">Description (optional)</Label>
        <Input
          placeholder="What this placeholder is for..."
          value={placeholder.description || ''}
          onChange={(e) => onUpdateDescription(e.target.value)}
          className="bg-secondary/30"
        />
      </div>

      {/* Value */}
      <div className="space-y-2">
        <Label className="text-xs">Value</Label>
        <Textarea
          value={placeholder.values[0] ?? ''}
          onChange={(e) => onUpdateValue(e.target.value)}
          placeholder="Enter value..."
          data-testid={`placeholder-value-textarea-${placeholder.name}-0`}
          className="min-h-[80px] bg-secondary/30 text-sm"
        />
      </div>
    </div>
  );
}

// Hook for placeholder text processing
export function usePlaceholderProcessor(
  config: PlaceholderConfig,
  placeholders: Placeholder[]
) {
  const regex = useMemo(() => {
    const escapedOpen = config.openSequence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedClose = config.closeSequence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`${escapedOpen}(\\w+)${escapedClose}`, 'g');
  }, [config]);

  const processText = useCallback((text: string): string => {
    return text.replace(regex, (match, name) => {
      const placeholder = placeholders.find(p => p.name === name);
      if (placeholder) {
        return placeholder.values[placeholder.currentValueIndex] || match;
      }
      return match;
    });
  }, [regex, placeholders]);

  const extractPlaceholders = useCallback((text: string): string[] => {
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  }, [regex]);

  return { processText, extractPlaceholders, regex };
}
