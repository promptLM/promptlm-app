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

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@promptlm/ui';
import { Badge } from '@promptlm/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { getProjectName } from '@api-common/projectModel';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { useProjectsContext } from '@api-common/projects/ProjectsContext';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Projects', path: '/projects' },
  { label: 'Prompts', path: '/prompts' },
  { label: 'New Prompt', path: '/prompts/new' },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeProject, isLoading } = useProjectsContext();
  const [addMenuOpen, setAddMenuOpen] = useState(false);
   const [projectModalOpen, setProjectModalOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const forcedProjectModalOpenRef = useRef(false);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Force project selection when none is active
  useEffect(() => {
    if (!isLoading && !activeProject) {
      setProjectModalOpen(true);
      forcedProjectModalOpenRef.current = true;
    }
  }, [isLoading, activeProject]);

  useEffect(() => {
    if (!isLoading && activeProject && forcedProjectModalOpenRef.current) {
      setProjectModalOpen(false);
      forcedProjectModalOpenRef.current = false;
    }
  }, [isLoading, activeProject]);

  const handleModalOpenChange = (open: boolean) => {
    setProjectModalOpen(open);
  };

  const activeProjectLabel = activeProject ? getProjectName(activeProject) : 'Select project';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        <Link to="/" className="flex items-center gap-2 mr-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <Terminal className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-gradient">PromptLab</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-accent text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />

          <div className="relative" ref={addMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              data-testid="add-button"
              onClick={(event) => {
                event.stopPropagation();
                setAddMenuOpen((open) => !open);
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
            {addMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-md border border-border bg-card shadow-lg z-50">
                <button
                  data-testid="create-prompt-button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50"
                  onClick={() => {
                    navigate('/prompts/new');
                    setAddMenuOpen(false);
                  }}
                >
                  New Prompt
                </button>
                <button
                  data-testid="create-project-button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50"
                  onClick={() => {
                    setProjectModalOpen(true);
                    setAddMenuOpen(false);
                  }}
                >
                  New Project
                </button>
              </div>
            )}
          </div>

          <button
            data-testid="project-selector"
            onClick={() => setProjectModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
          >
            <span className="text-sm text-muted-foreground">Active project</span>
            <Badge variant="outline" className="font-mono text-xs">
              {activeProjectLabel}
            </Badge>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <ProjectModal open={projectModalOpen} onOpenChange={handleModalOpenChange} />
    </header>
  );
}
