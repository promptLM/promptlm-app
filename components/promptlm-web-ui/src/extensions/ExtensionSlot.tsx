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

import React, { Suspense } from 'react';
import type { ExtensionSlot as SlotName, ExtensionContext } from './registry';
import { getExtensionsForSlot } from './registry';

type ExtensionSlotProps = {
  slot: SlotName;
  context: ExtensionContext;
};

export const ExtensionSlot = ({ slot, context }: ExtensionSlotProps) => {
  const extensions = getExtensionsForSlot(slot);
  if (!extensions.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {extensions.map(({ id, Component }) => (
        <Suspense key={id} fallback={null}>
          <Component {...context} />
        </Suspense>
      ))}
    </div>
  );
};
