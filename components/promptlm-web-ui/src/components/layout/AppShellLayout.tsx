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

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppShellV2,
  AppSidebar,
  type SidebarNavItem,
} from '@promptlm/ui';
import { useProjectsContext } from '@api-common/projects/ProjectsContext';
import { getProjectName } from '@api-common/projectModel';
import { ProjectModal } from '@/components/projects/ProjectModal';

const PRIMARY_NAV: ReadonlyArray<{
  id: string;
  label: string;
  icon: string;
  href?: string;
  /** When true the item is rendered dim and non-interactive (coming-soon). */
  disabled?: boolean;
  badge?: string;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: '◫', href: '/' },
  { id: 'prompts', label: 'Prompts', icon: '⌘', href: '/prompts' },
  { id: 'mcp', label: 'MCP', icon: '⌥', disabled: true },
  { id: 'mocks', label: 'Mocks', icon: '◐', disabled: true },
  { id: 'evals', label: 'Evals', icon: '◇', disabled: true, badge: 'PRO' },
  { id: 'runs', label: 'Runs', icon: '▷', disabled: true },
  { id: 'projects', label: 'Projects', icon: '▤', href: '/projects' },
];

const SECONDARY_NAV: ReadonlyArray<{
  id: string;
  label: string;
  icon: string;
  href?: string;
  disabled?: boolean;
}> = [
  { id: 'docs', label: 'Docs', icon: '⏚', disabled: true },
  { id: 'settings', label: 'Settings', icon: '◎', disabled: true },
];

const matchesActive = (pathname: string, href?: string): boolean => {
  if (!href) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
};

/**
 * Top-level layout for all v2-routed pages. Replaces the legacy horizontal
 * Header with a fixed-width sidebar; the workspace switcher reuses the
 * existing ProjectsContext + ProjectModal so project switching keeps working
 * without re-wiring.
 */
export function AppShellLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeProject, isLoading } = useProjectsContext();
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const forcedProjectModalOpenRef = useRef(false);

  // Force project selection when none is active (parity with legacy Header).
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

  const primaryNav = useMemo<SidebarNavItem[]>(
    () =>
      PRIMARY_NAV.map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        href: item.href,
        active: matchesActive(location.pathname, item.href),
        disabled: item.disabled,
        badge: item.badge,
        onClick: item.href
          ? (event?: React.MouseEvent) => {
              if (event) event.preventDefault();
              navigate(item.href!);
            }
          : undefined,
      })),
    [location.pathname, navigate],
  );

  const secondaryNav = useMemo<SidebarNavItem[]>(
    () =>
      SECONDARY_NAV.map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        href: item.href,
        disabled: item.disabled,
        active: matchesActive(location.pathname, item.href),
      })),
    [location.pathname],
  );

  const workspace = activeProject
    ? {
        id: activeProject.id ?? 'active-project',
        initial: getProjectName(activeProject).slice(0, 1).toUpperCase(),
        label: getProjectName(activeProject),
      }
    : undefined;

  return (
    <>
      <AppShellV2
        sidebar={
          <AppSidebar
            brandSubtitle="local"
            workspace={workspace}
            onWorkspaceClick={() => setProjectModalOpen(true)}
            primaryNav={primaryNav}
            secondaryNav={secondaryNav}
          />
        }
      >
        {children}
      </AppShellV2>
      <ProjectModal open={projectModalOpen} onOpenChange={setProjectModalOpen} />
    </>
  );
}
