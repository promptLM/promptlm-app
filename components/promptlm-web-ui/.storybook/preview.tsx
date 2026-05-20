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

import type { Decorator, Preview } from '@storybook/react-vite';
import React from 'react';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import '@/index.css';

// NOTE: '@/theme/ThemeProvider' and '@/stories/mocks/handlers' were referenced
// by an early Storybook scaffold but never landed in the source tree. There are
// currently no *.stories.* files in this workspace, so these imports never
// actually resolved anything at runtime — but they did break the static
// `storybook build`. Stubbed locally to let the Storybook 9 preview bundle
// compile; restore real imports when the first stories land and the matching
// theme/mocks modules are added under src/.
const ThemeProvider = ({ children }: { children: React.ReactNode; defaultTheme?: string }) => <>{children}</>;
const defaultHandlers: unknown[] = [];

// Pre-existing import 'PromptLMClientProvider' from '@/api/context' was
// renamed in source to 'GeneratedApiClientProvider'; aliasing here so the
// decorator below still compiles.
import { GeneratedApiClientProvider as PromptLMClientProvider } from '@/api/context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster as AppToaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

initialize({ onUnhandledRequest: 'bypass' });

const AppProviders = ({
  initialEntries,
  children,
}: {
  initialEntries: string[];
  children: React.ReactNode;
}) => {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PromptLMClientProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <MemoryRouter initialEntries={initialEntries}>
              {children}
              <AppToaster />
              <SonnerToaster />
            </MemoryRouter>
          </TooltipProvider>
        </ThemeProvider>
      </PromptLMClientProvider>
    </QueryClientProvider>
  );
};

const withAppProviders: Decorator = (Story, context) => {
  const initialEntries = (context.parameters?.router?.initialEntries as string[] | undefined) ?? ['/'];

  return (
    <AppProviders initialEntries={initialEntries}>
      <Story />
    </AppProviders>
  );
};

const preview: Preview = {
  decorators: [mswDecorator, withAppProviders],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: defaultHandlers,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
