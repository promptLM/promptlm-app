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

import { useMemo } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PromptCard } from '@/components/prompts/PromptCard';
import { FileText, FolderOpen, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useDashboardSummary, usePrompts, useProjects } from '@/api/hooks';

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useDashboardSummary();
  const { data: prompts, isLoading: isPromptsLoading, error: promptsError } = usePrompts();
  const { data: projects } = useProjects();

  const totalPrompts = summary?.totalPrompts ?? 0;
  const activeProjects = summary?.activeProjects ?? 0;
  const lastUpdated = summary?.lastUpdated ? new Date(summary.lastUpdated) : new Date();
  const recentPrompts = useMemo(() => {
    if (!prompts) {
      return [];
    }
    return [...prompts]
      .sort((a, b) => {
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 3);
  }, [prompts]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview and KPIs for your projects.</p>
      </div>

      {(summaryError || promptsError) && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {summaryError && <p>Failed to load dashboard summary: {summaryError.message}</p>}
          {promptsError && <p>Failed to load prompts: {promptsError.message}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Prompts"
          value={totalPrompts}
          subtitle={projects ? `Across ${projects.length} projects` : 'Across all projects'}
          icon={FileText}
          isLoading={isSummaryLoading}
        />
        <StatsCard
          title="Active Projects"
          value={activeProjects}
          subtitle="Using PromptLab"
          icon={FolderOpen}
          isLoading={isSummaryLoading}
        />
        <StatsCard
          title="Executions Today"
          value="1,247"
          subtitle="API calls"
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
          isLoading={isSummaryLoading}
        />
        <StatsCard
          title="Last Updated"
          value={format(lastUpdated, 'MMM d, yyyy')}
          subtitle="Data freshness"
          icon={Clock}
          isLoading={isSummaryLoading}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Prompts</h2>
          <a href="/prompts" className="text-sm text-primary hover:underline">
            View all →
          </a>
        </div>
        {isPromptsLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-32 rounded-xl border border-border bg-secondary/20 animate-pulse" />
            ))}
          </div>
        ) : recentPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">No recent prompts yet. Create one to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
