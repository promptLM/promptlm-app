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

import * as React from 'react';
import { MiniLogo, Mono } from '../atoms';
import type { SidebarNavItem, SidebarUser, SidebarWorkspace } from './types';

export interface AppSidebarProps {
  /** Brand line under the logo, e.g. "v0.9.3 · local". Optional. */
  brandSubtitle?: string;
  workspace?: SidebarWorkspace;
  onWorkspaceClick?: () => void;
  /** Top section ("Library") nav items. */
  primaryNav: readonly SidebarNavItem[];
  /** Bottom section nav items (Docs, Settings). */
  secondaryNav?: readonly SidebarNavItem[];
  user?: SidebarUser;
  /** Called when the user chip is clicked. */
  onUserClick?: () => void;
}

const FONT_MONO = 'var(--pl-mono)';

const NavRow: React.FC<{ item: SidebarNavItem }> = ({ item }) => {
  const isActive = item.active === true;
  const isLink = !!item.href && !item.disabled;
  const commonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '7px 10px',
    borderRadius: 6,
    fontSize: 13.5,
    fontWeight: isActive ? 500 : 400,
    color: item.disabled
      ? 'var(--pl-ink-400)'
      : isActive
      ? 'var(--pl-ink-900)'
      : 'var(--pl-ink-600)',
    background: isActive ? 'var(--pl-ink-100)' : 'transparent',
    cursor: item.disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    textAlign: 'left',
    width: '100%',
    fontFamily: 'var(--pl-display)',
    textDecoration: 'none',
  };
  const inner = (
    <>
      <span
        aria-hidden="true"
        style={{
          fontFamily: FONT_MONO,
          fontSize: 13,
          color: item.disabled
            ? 'var(--pl-ink-300)'
            : isActive
            ? 'var(--pl-signal-deep)'
            : 'var(--pl-ink-500)',
          width: 14,
          textAlign: 'center',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.icon}
      </span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
      {item.badge != null && (
        <Mono size={10.5} color="var(--pl-ink-500)">
          {item.badge}
        </Mono>
      )}
    </>
  );
  if (isLink) {
    return (
      <a
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.ariaLabel ?? item.label}
        onClick={item.onClick}
        style={commonStyle}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={item.disabled ? undefined : item.onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={item.ariaLabel ?? item.label}
      aria-disabled={item.disabled || undefined}
      disabled={item.disabled}
      style={commonStyle}
    >
      {inner}
    </button>
  );
};

export const AppSidebar: React.FC<AppSidebarProps> = ({
  brandSubtitle,
  workspace,
  onWorkspaceClick,
  primaryNav,
  secondaryNav = [],
  user,
  onUserClick,
}) => (
  <aside
    style={{
      width: 232,
      flexShrink: 0,
      background: 'var(--pl-paper)',
      borderRight: '1px solid var(--pl-ink-200)',
      display: 'flex',
      flexDirection: 'column',
      padding: '18px 14px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 18px' }}>
      <MiniLogo size={22} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span style={{ fontWeight: 500, fontSize: 14, letterSpacing: '-0.01em' }}>promptLM</span>
        {brandSubtitle && (
          <Mono size={10.5} color="var(--pl-ink-500)" style={{ letterSpacing: '0.02em' }}>
            {brandSubtitle}
          </Mono>
        )}
      </div>
    </div>

    {workspace && (
      <button
        type="button"
        onClick={onWorkspaceClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 10px',
          marginBottom: 14,
          background: 'transparent',
          border: '1px solid var(--pl-ink-200)',
          borderRadius: 7,
          cursor: 'pointer',
          fontFamily: 'var(--pl-display)',
          fontSize: 13,
          color: 'var(--pl-ink-800)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: workspace.color ?? 'var(--pl-signal-deep)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--pl-paper)',
              fontSize: 9,
              fontFamily: FONT_MONO,
            }}
          >
            {workspace.initial}
          </span>
          {workspace.label}
        </span>
        <span aria-hidden="true" style={{ color: 'var(--pl-ink-500)', fontSize: 11 }}>
          ⌄
        </span>
      </button>
    )}

    <Mono
      size={10}
      color="var(--pl-ink-500)"
      style={{
        padding: '0 10px 6px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      Library
    </Mono>
    <nav aria-label="Primary navigation" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {primaryNav.map((it) => (
        <NavRow key={it.id} item={it} />
      ))}
    </nav>

    <div style={{ flex: 1 }} />

    {secondaryNav.length > 0 && (
      <nav
        aria-label="Secondary navigation"
        style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 10 }}
      >
        {secondaryNav.map((it) => (
          <NavRow key={it.id} item={it} />
        ))}
      </nav>
    )}

    {user && (
      <button
        type="button"
        onClick={onUserClick}
        aria-label={`Signed in as ${user.name}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 7,
          border: '1px solid var(--pl-ink-200)',
          background: 'transparent',
          cursor: onUserClick ? 'pointer' : 'default',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            background: 'var(--pl-ink-300)',
            color: 'var(--pl-ink-800)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10.5,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {user.initials}
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1.2,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              color: 'var(--pl-ink-800)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.name}
          </span>
          <Mono
            size={10}
            color="var(--pl-ink-500)"
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {user.email}
          </Mono>
        </div>
      </button>
    )}
  </aside>
);
