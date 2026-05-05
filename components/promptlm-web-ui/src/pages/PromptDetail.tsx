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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DetailSection,
  ExecutionsTable,
  executionRowDomId,
  KV,
  MessageBlock,
  MetricsStrip,
  Mono,
  PlaceholderTable,
  PromptDetailHeader,
  SpecBlock,
  ToastAction,
} from '@promptlm/ui';
import { usePromptDetails } from '@/api/hooks';
import { useGeneratedApiClient } from '@api-common/generatedClientProvider';
import { mapPromptSpecToDetailViewModel } from '@api-common/viewModels/promptsV2';
import { featureFlags } from '@/lib/featureFlags';
import { useToast } from '@/hooks/use-toast';
import { toDisplayError } from '@api-common/apiError';

const HIGHLIGHT_MS = 3500;

const DETAIL_TOPBAR_HEIGHT = 52;

interface TopBarProps {
  name: string;
  editTo: string;
  isRunning: boolean;
  onRun: () => void;
}

const TopBar = ({ name, editTo, isRunning, onRun }: TopBarProps) => (
  <header
    style={{
      height: DETAIL_TOPBAR_HEIGHT,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 24px',
      borderBottom: '1px solid var(--pl-ink-200)',
      background: 'var(--pl-paper)',
    }}
  >
    <Mono size={11} color="var(--pl-ink-500)" style={{ letterSpacing: '0.06em' }}>
      prompts / <span style={{ color: 'var(--pl-ink-800)' }}>{name}</span>
    </Mono>
    <div style={{ flex: 1 }} />
    <button
      type="button"
      onClick={onRun}
      disabled={isRunning}
      className="pl-btn pl-btn-ghost"
      data-testid="prompt-run-action"
      style={{
        height: 32,
        padding: '0 14px',
        fontSize: 13,
        cursor: isRunning ? 'wait' : 'pointer',
      }}
    >
      <span style={{ fontFamily: 'var(--pl-mono)', fontSize: 11, marginRight: 6 }}>▷</span>
      {isRunning ? 'Running…' : 'Run'}
    </button>
    <Link
      to={editTo}
      className="pl-btn pl-btn-primary"
      data-testid="prompt-edit-action"
      style={{
        height: 32,
        padding: '0 14px',
        fontSize: 13,
        textDecoration: 'none',
      }}
    >
      Edit
    </Link>
  </header>
);

export default function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refresh } = usePromptDetails(id ?? null);
  const { promptSpecs } = useGeneratedApiClient();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [highlightedExecutionId, setHighlightedExecutionId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const view = useMemo(() => (data ? mapPromptSpecToDetailViewModel(data) : null), [data]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const focusExecution = useCallback((executionId: string) => {
    setHighlightedExecutionId(executionId);
    if (typeof document !== 'undefined') {
      const node = document.getElementById(executionRowDomId(executionId));
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedExecutionId((current) => (current === executionId ? null : current));
    }, HIGHLIGHT_MS);
  }, []);

  /**
   * Detail-page Run CTA — implements the playbook's
   * `executeStoredPrompt(id)` contract from
   * `design/handoff/playbook/surfaces/detail.html`. Calls the generated
   * client, surfaces success / failure via toast, and refreshes the prompt
   * details so the new execution appears in the metrics strip and recent
   * runs table without a manual reload.
   *
   * Per #95's design call (designer comment: "the toast should link to the
   * new entry in executions[] so the user can drill into the run they just
   * kicked off without hunting"), the success toast carries a "View
   * execution" action that scrolls to and briefly highlights the new row
   * in the executions table.
   */
  const handleRun = useCallback(async () => {
    if (!id || isRunning) {
      return;
    }
    setIsRunning(true);
    try {
      const updated = await promptSpecs.executeStoredPrompt(id);
      await refresh();
      // executeStoredPrompt returns the full PromptSpec including the newly
      // appended execution; pluck the most recent one (newest first by
      // existing convention) so the toast action can scroll to it.
      const newExecutionId = updated?.executions?.[0]?.id ?? null;
      toast({
        title: 'Prompt executed',
        description: 'New run appended to recent executions.',
        action: newExecutionId
          ? (
              <ToastAction
                altText="Scroll to the new execution"
                onClick={() => focusExecution(newExecutionId)}
              >
                View execution
              </ToastAction>
            )
          : undefined,
      });
    } catch (err) {
      const display = toDisplayError(err);
      toast({
        variant: 'destructive',
        title: 'Run failed',
        description: display.message,
      });
    } finally {
      setIsRunning(false);
    }
  }, [focusExecution, id, isRunning, promptSpecs, refresh, toast]);

  if (!id) {
    return (
      <div style={{ padding: 32, color: 'var(--pl-ink-700)' }}>Missing prompt id.</div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          margin: 32,
          padding: '12px 16px',
          background: 'color-mix(in oklch, var(--pl-fail) 8%, var(--pl-paper))',
          border: '1px solid color-mix(in oklch, var(--pl-fail) 30%, var(--pl-ink-200))',
          color: 'oklch(0.42 0.13 25)',
          borderRadius: 'var(--pl-r-md)',
          fontSize: 13.5,
        }}
      >
        Failed to load prompt. {error.message}
      </div>
    );
  }

  if (isLoading || !view) {
    return (
      <div style={{ padding: 32, color: 'var(--pl-ink-600)', fontSize: 13.5 }}>
        Loading prompt…
      </div>
    );
  }

  const editTo = `/prompts/${id}/edit`;
  const showMetrics = featureFlags.executionMetrics && view.metrics !== null;

  return (
    <div
      style={{
        background: 'var(--pl-canvas)',
        fontFamily: 'var(--pl-display)',
        color: 'var(--pl-ink-900)',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TopBar name={view.name} editTo={editTo} isRunning={isRunning} onRun={handleRun} />

      <PromptDetailHeader
        name={view.name}
        description={view.description}
        group={view.group}
        version={view.version}
        rev={view.rev}
        vendor={view.vendor}
        model={view.model}
        status={view.status}
      />

      {showMetrics && (
        <DetailSection num="01" title="Dev execution metrics" anchor="metrics">
          <p
            style={{
              margin: '0 0 20px',
              fontSize: 13.5,
              lineHeight: 1.6,
              color: 'var(--pl-ink-700)',
              maxWidth: 720,
            }}
          >
            Aggregated across {view.metrics?.runs} dev runs — local{' '}
            <Mono color="var(--pl-ink-900)">promptlm run</Mono> invocations and CI smoke tests.
            No production traffic.
          </p>
          <MetricsStrip metrics={view.metrics!} />
        </DetailSection>
      )}

      <DetailSection num={showMetrics ? '02' : '01'} title="Spec" anchor="spec">
        <SpecBlock title="request">
          <KV k="vendor" v={view.request.vendor} />
          <KV k="model" v={view.request.model} />
          <KV
            k="type"
            v={view.request.type}
            last={view.request.parameters.length === 0}
          />
          {view.request.parameters.map(([k, v], i) => (
            <KV
              key={k}
              k={`parameters.${k}`}
              v={v}
              last={i === view.request.parameters.length - 1}
            />
          ))}
        </SpecBlock>

        {view.placeholders.length > 0 && (
          <SpecBlock title={`placeholders · ${view.placeholders.length}`}>
            <PlaceholderTable placeholders={view.placeholders} />
          </SpecBlock>
        )}

        {view.messages.length > 0 && (
          <SpecBlock title={`messages · ${view.messages.length}`}>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {view.messages.map((m, i) => (
                <MessageBlock key={i} role={m.role} body={m.body} />
              ))}
            </div>
          </SpecBlock>
        )}
      </DetailSection>

      {featureFlags.executionMetrics && view.executions.length > 0 && (
        <DetailSection
          num={showMetrics ? '03' : '02'}
          title="Recent dev executions"
          anchor="executions"
        >
          <p
            style={{
              margin: '0 0 20px',
              fontSize: 13.5,
              lineHeight: 1.6,
              color: 'var(--pl-ink-700)',
              maxWidth: 720,
            }}
          >
            Last <Mono color="var(--pl-ink-900)">{view.executions.length}</Mono> recorded runs.
          </p>
          <ExecutionsTable
            rows={view.executions}
            highlightedId={highlightedExecutionId}
          />
        </DetailSection>
      )}
    </div>
  );
}
