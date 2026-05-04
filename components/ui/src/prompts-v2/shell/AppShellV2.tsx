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

export interface AppShellV2Props {
  /** Sidebar slot — typically <AppSidebar />. */
  sidebar: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Outer chrome for the v2 webui — renders a fixed-width sidebar on the left
 * and a flexible main column on the right. The sidebar must size itself
 * (the default `<AppSidebar />` is 232px wide); this component just supplies
 * the flex container and the `pl` typography class so the cascade picks up
 * Geist + JetBrains Mono.
 */
export const AppShellV2: React.FC<AppShellV2Props> = ({ sidebar, children }) => (
  <div
    className="pl"
    style={{ display: 'flex', minHeight: '100%', background: 'var(--pl-canvas)' }}
  >
    {sidebar}
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      {children}
    </div>
  </div>
);
