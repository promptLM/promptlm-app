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

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PromptCard } from '@/components/prompts/PromptCard';
import { Button } from '@promptlm/ui';
import { Input } from '@promptlm/ui';
import { Filter, Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { usePrompts } from '@/api/hooks';

export default function Prompts() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: prompts, isLoading, error, refresh } = usePrompts();

  const filteredPrompts = useMemo(() => {
    if (!prompts) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return prompts;
    }

    return prompts.filter((prompt) =>
      (prompt.name ?? '').toLowerCase().includes(query) || (prompt.description ?? '').toLowerCase().includes(query)
    );
  }, [prompts, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Prompts</h1>
        <p className="text-muted-foreground">Browse and manage your library of prompts.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="glow">
          <Link to="/prompts/new" className="gap-2">
            <Plus className="h-4 w-4" />
            New Prompt
          </Link>
        </Button>
        
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/30"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refresh()}
            disabled={isLoading}
            aria-label="Refresh prompts"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load prompts. {error.message}
        </div>
      )}

      {isLoading && !prompts ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 rounded-xl border border-border bg-secondary/20 animate-pulse" />
          ))}
        </div>
      ) : filteredPrompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-muted-foreground">No prompts found matching your search.</p>
        </div>
      )}
    </div>
  );
}
