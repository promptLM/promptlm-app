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

import { Link } from 'react-router-dom';
import type { PromptSpec } from '@promptlm/api-client';
import { Badge } from '@promptlm/ui';
import { Clock, GitBranch, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PromptCardProps {
  prompt: PromptSpec;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const name = prompt.name ?? '';
  const description = prompt.description ?? '';
  const status = (prompt.status ?? 'ACTIVE').toLowerCase();
  const version = prompt.version ?? '';
  const revision = prompt.revision ?? 0;
  const updatedAt = prompt.updatedAt ? new Date(prompt.updatedAt) : new Date();
  const modelVendor = prompt.request?.vendor ?? '';
  const modelName = prompt.request?.model ?? '';

  const statusVariant = {
    active: 'success',
    draft: 'warning',
    archived: 'muted',
    retired: 'muted',
  } as const;

  const badgeKey = status in statusVariant ? (status as keyof typeof statusVariant) : 'active';

  return (
    <Link
      to={`/prompts/${prompt.id ?? ''}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
      data-testid={`prompt-card-${name}-action`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold font-mono text-foreground group-hover:text-primary transition-colors truncate">
              {name}
            </h3>
            <Badge variant={statusVariant[badgeKey]}>
              {status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GitBranch className="h-4 w-4" />
          <span className="font-mono">{version}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="h-4 w-4" />
          <span>Rev {revision}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}</span>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Model:</span>
          <Badge variant="secondary" className="font-mono text-xs">
            {modelVendor}/{modelName}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
