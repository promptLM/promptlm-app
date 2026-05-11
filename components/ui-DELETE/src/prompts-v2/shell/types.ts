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

import type * as React from 'react';

export interface SidebarNavItem {
  id: string;
  label: string;
  /**
   * Icon node — typically a Lucide React component or a glyph string.
   * Rendered in a 14px-wide centered slot.
   */
  icon?: React.ReactNode;
  /** href for an `<a>` element. When provided, item renders as a link. */
  href?: string;
  /** Click handler — used when href is not set or to augment navigation. */
  onClick?: () => void;
  /** Renders the item with active styling. */
  active?: boolean;
  /** Right-aligned badge (e.g. count or `PRO`). */
  badge?: React.ReactNode;
  /** Renders the item de-emphasised and non-interactive (for "coming soon" items). */
  disabled?: boolean;
  /** Optional aria-label override; defaults to `label`. */
  ariaLabel?: string;
}

export interface SidebarWorkspace {
  id: string;
  /** Short letter or glyph rendered inside the colored avatar tile (e.g. "A"). */
  initial: string;
  label: string;
  /** Background color for the avatar tile (defaults to `--pl-signal-deep`). */
  color?: string;
}

export interface SidebarUser {
  initials: string;
  name: string;
  email: string;
}
