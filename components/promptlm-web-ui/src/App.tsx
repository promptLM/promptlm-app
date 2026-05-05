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

import { useEffect, useMemo, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from '@promptlm/ui';
import { TooltipProvider } from '@promptlm/ui';
import { createPromptLMTheme } from '@promptlm/ui';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CssBaseline } from "@mui/material";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { AppShellLayout } from "@/components/layout/AppShellLayout";
import Index from "./pages/Index";
import Prompts from "./pages/Prompts";
import PromptDetail from "./pages/PromptDetail";
import PromptDiff from "./pages/PromptDiff";
import PromptEdit from "./pages/PromptEdit";
import NewPrompt from "./pages/NewPrompt";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";
import { GeneratedApiClientProvider } from "@api-common/generatedClientProvider";
import { ProjectsProvider } from "@api-common/projects/ProjectsContext";
import { useCapabilities } from "@/api/hooks";
import { loadExtensionsForCapabilities } from "@/extensions/capabilities";

const queryClient = new QueryClient();

const ExtensionsBootstrap = () => {
  const { data } = useCapabilities();

  useEffect(() => {
    void loadExtensionsForCapabilities(data?.features ?? []);
  }, [data]);

  return null;
};

// v2 ships in light only — dark-mode tokens were not part of the design
// handoff. We pin next-themes to "light" so existing components built on the
// HSL `--background`/`--foreground` Tailwind tokens render against the same
// palette as the new --pl-* tokens. Re-enable when a dark token pass lands.
const MuiThemeBridge = ({ children }: { children: ReactNode }) => {
  const muiTheme = useMemo(() => createPromptLMTheme({ variant: 'lightTech' }), []);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />

      {children}
    </MuiThemeProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GeneratedApiClientProvider>
      <ProjectsProvider>
        <ExtensionsBootstrap />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <MuiThemeBridge>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppShellLayout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/prompts" element={<Prompts />} />
                    <Route path="/prompts/new" element={<NewPrompt />} />
                    <Route path="/prompts/:id" element={<PromptDetail />} />
                    <Route path="/prompts/:id/diff" element={<PromptDiff />} />
                    <Route path="/prompts/:id/edit" element={<PromptEdit />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppShellLayout>
              </BrowserRouter>
            </TooltipProvider>
          </MuiThemeBridge>
        </ThemeProvider>
      </ProjectsProvider>
    </GeneratedApiClientProvider>
  </QueryClientProvider>
);

export default App;
