import assert from 'node:assert/strict';
import React from 'react';
import {
  AppBar,
  AppShell,
  AppShellHeader,
  CloneProjectForm,
  CreateProjectForm,
  ImportLocalProjectForm,
  InfoCard,
  InfoCardHeader,
  ProjectSelectionDialog,
  PromptEditorHeader,
  PromptEditorTabs,
  SectionCard,
  SideNav,
} from '../dist/index.js';
import { renderWithPromptLMTheme } from './renderWithPromptLMTheme.mjs';

const verifyLayoutExports = () => {
  assert.equal(typeof AppBar, 'function');
  assert.equal(typeof SideNav, 'function');
  assert.equal(typeof ProjectSelectionDialog, 'function');

  const shellMarkup = renderWithPromptLMTheme(
    React.createElement(
      AppShell,
      {
        appBar: React.createElement('div', null, 'Header slot'),
        sideNav: React.createElement('div', null, 'Navigation slot'),
      },
      React.createElement('div', null, 'Workspace overview'),
    ),
  );
  const headerMarkup = renderWithPromptLMTheme(
    React.createElement(AppShellHeader, {
      title: 'Prompt Workspace',
      nav: React.createElement('span', null, 'Prompts'),
      endSlot: React.createElement('button', { type: 'button' }, 'Refresh'),
    }),
  );
  const createMarkup = renderWithPromptLMTheme(
    React.createElement(CreateProjectForm, {
      onSubmit: () => undefined,
      owners: [{ id: 'owner-1', displayName: 'PromptLM Labs', type: 'ORGANIZATION' }],
    }),
  );
  const importMarkup = renderWithPromptLMTheme(
    React.createElement(ImportLocalProjectForm, { onSubmit: () => undefined }),
  );
  const cloneMarkup = renderWithPromptLMTheme(
    React.createElement(CloneProjectForm, { onSubmit: () => undefined }),
  );

  assert.match(shellMarkup, /Header slot/);
  assert.match(shellMarkup, /Navigation slot/);
  assert.match(shellMarkup, /Workspace overview/);
  assert.match(headerMarkup, /Prompt Workspace/);
  assert.match(headerMarkup, /Refresh/);
  assert.match(createMarkup, /Create new project/);
  assert.match(createMarkup, /Owner/);
  assert.match(importMarkup, /Import local repository/);
  assert.match(cloneMarkup, /Clone remote repository/);
};

const verifyInfoAndSectionCards = () => {
  const infoCardMarkup = renderWithPromptLMTheme(
    React.createElement(InfoCard, {
      title: 'PromptLM Core',
      subtitle: 'Shared workspace',
      description: 'Primary prompt repository',
      statusLabel: 'Active',
      metadata: [
        { label: 'Branch', value: 'main' },
        { label: 'Prompts', value: 24 },
      ],
      actions: React.createElement('button', { type: 'button' }, 'Open'),
    }),
  );
  const infoCardHeaderMarkup = renderWithPromptLMTheme(
    React.createElement(InfoCardHeader, {
      title: 'Marketing prompts',
      subtitle: 'Campaign experiments',
    }),
  );
  const sectionCardMarkup = renderWithPromptLMTheme(
    React.createElement(
      SectionCard,
      {
        title: 'Prompt summary',
        subtitle: 'Current draft state',
        action: React.createElement('button', { type: 'button' }, 'Refresh'),
      },
      React.createElement('div', null, 'Prompt details'),
    ),
  );

  assert.match(infoCardMarkup, /PromptLM Core/);
  assert.match(infoCardMarkup, /Branch/);
  assert.match(infoCardMarkup, /Open/);
  assert.match(infoCardHeaderMarkup, /Marketing prompts/);
  assert.match(infoCardHeaderMarkup, /Campaign experiments/);
  assert.match(sectionCardMarkup, /Prompt summary/);
  assert.match(sectionCardMarkup, /Refresh/);
  assert.match(sectionCardMarkup, /Prompt details/);
};

const verifyPromptEditorExports = () => {
  const headerMarkup = renderWithPromptLMTheme(
    React.createElement(PromptEditorHeader, {
      mode: 'create',
      title: 'Create Prompt',
      description: 'Draft a new prompt definition.',
      messages: [{ severity: 'info', text: 'Latest draft saved a minute ago.' }],
      onCreate: () => undefined,
      onBack: () => undefined,
    }),
  );
  const tabsMarkup = renderWithPromptLMTheme(
    React.createElement(PromptEditorTabs, {
      tabs: [
        { value: 'editor', label: 'Editor' },
        { value: 'preview', label: 'Preview', badge: 2 },
        { value: 'history', label: 'History' },
      ],
      value: 'preview',
      onChange: () => undefined,
      executionOptions: {
        selectedId: 'execution-2',
        options: [
          { id: 'execution-1', label: 'Manual run', helperText: '5 min ago' },
          { id: 'execution-2', label: 'Canary', helperText: '12 min ago' },
        ],
        onSelect: () => undefined,
      },
      tabPanelSlot: React.createElement('div', null, 'Preview content'),
    }),
  );

  assert.match(headerMarkup, /Create Prompt/);
  assert.match(headerMarkup, /Latest draft saved a minute ago\./);
  assert.match(headerMarkup, /New prompt/);
  assert.match(headerMarkup, /Back to prompts/);
  assert.match(tabsMarkup, /Editor/);
  assert.match(tabsMarkup, /Preview/);
  assert.match(tabsMarkup, /Canary/);
  assert.match(tabsMarkup, /Preview content/);
};

verifyLayoutExports();
verifyInfoAndSectionCards();
verifyPromptEditorExports();

console.log('UI package smoke checks passed');
process.exit(0);
