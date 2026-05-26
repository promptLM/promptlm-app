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

/**
 * Issue #185 — confirmation dialog shown when the user attempts to leave the
 * prompt editor with unsaved changes. Offers three branches:
 *
 * - **Save changes** — save the draft, then continue the pending navigation.
 * - **Discard**      — drop edits, then continue the pending navigation.
 * - **Cancel**       — stay on the page; no navigation, no state change.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type UnsavedChangesDialogProps = {
  open: boolean;
  isSaving?: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};

export const UnsavedChangesDialog = ({
  open,
  isSaving = false,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) => {
  const handleOpenChange = (next: boolean) => {
    if (!next) onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="unsaved-changes-dialog">
        <DialogHeader>
          <DialogTitle>Unsaved changes</DialogTitle>
          <DialogDescription>
            You have unsaved edits to this prompt. What do you want to do?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            data-testid="unsaved-changes-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onDiscard}
            disabled={isSaving}
            data-testid="unsaved-changes-discard"
          >
            Discard
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving}
            data-testid="unsaved-changes-save"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnsavedChangesDialog;
