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

import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import { Theme } from '@mui/material/styles';

export type ProjectSelectionDialogProject = {
  id: string;
  name: string;
  repositoryUrl?: string;
  localPath?: string;
  description?: string;
  promptCount?: number;
  healthMessage?: string | null;
  isSelectable?: boolean;
  selectionBlockedReason?: string | null;
};

export type ProjectSelectionDialogProps = {
  open: boolean;
  onClose: () => void;
  projects: ProjectSelectionDialogProject[];
  activeProjectId?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onSelect: (projectId: string) => void;
  onRefresh?: () => void;
  tabs?: ProjectSelectionDialogTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  selectTabLabel?: string;
};

export type ProjectSelectionDialogTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

export const ProjectSelectionDialog: React.FC<ProjectSelectionDialogProps> = ({
  open,
  onClose,
  projects,
  activeProjectId,
  isLoading = false,
  error,
  onSelect,
  onRefresh,
  tabs,
  activeTabId,
  onTabChange,
  selectTabLabel = 'Select',
}) => {
  const hasProjects = projects.length > 0;
  const allTabs = React.useMemo(() => {
    const extraTabs = tabs ?? [];
    return [
      { id: 'select', label: selectTabLabel },
      ...extraTabs,
    ];
  }, [tabs, selectTabLabel]);

  const tabIds = React.useMemo(() => allTabs.map((tab) => tab.id), [allTabs]);
  const [internalTab, setInternalTab] = React.useState<string>('select');

  React.useEffect(() => {
    if (open && activeTabId === undefined) {
      setInternalTab('select');
    }
  }, [open, activeTabId]);

  React.useEffect(() => {
    if (!tabIds.includes(internalTab)) {
      setInternalTab('select');
    }
  }, [tabIds, internalTab]);

  const currentTab = React.useMemo(() => {
    const desired = activeTabId ?? internalTab;
    return tabIds.includes(desired) ? desired : 'select';
  }, [activeTabId, internalTab, tabIds]);

  const isControlled = activeTabId !== undefined;

  const handleTabChange = (_: React.SyntheticEvent, nextTabId: string) => {
    if (!isControlled) {
      setInternalTab(nextTabId);
    }
    onTabChange?.(nextTabId);
  };

  const activeExtraTab = React.useMemo(() => {
    if (currentTab === 'select') {
      return null;
    }
    return (tabs ?? []).find((tab) => tab.id === currentTab) ?? null;
  }, [currentTab, tabs]);

  const isSelectTab = currentTab === 'select';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          border: '1px solid',
          borderColor: (theme: Theme) => theme.palette.primary.main,
          background: (theme: Theme) => `${theme.palette.background.paper}CC`,
          backdropFilter: 'blur(18px)',
          boxShadow: (theme: Theme) => `0 20px 45px ${theme.palette.common.black}33`,
          mt: { xs: 6, md: 8 },
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: (theme: Theme) => `${theme.palette.background.default}CC`,
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>Project Setup Required</DialogTitle>
      <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 1 }}>
        Select project, or create/import one to continue.
      </Typography>
      <DialogContent dividers sx={{ borderColor: 'divider', pt: allTabs.length > 1 ? 1 : 2 }}>
        <Stack spacing={2}>
          {allTabs.length > 1 ? (
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                minHeight: 40,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  minHeight: 40,
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: 99,
                },
              }}
            >
              {allTabs.map((tab) => (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  label={tab.label}
                />
              ))}
            </Tabs>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}

          {isLoading && isSelectTab ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : null}

          {isSelectTab && !isLoading && hasProjects ? (
            <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {projects.map((project) => {
                const selected = project.id === activeProjectId;
                const isSelectable = project.isSelectable ?? true;
                const warningMessage = project.selectionBlockedReason ?? project.healthMessage;
                return (
                  <ListItemButton
                    key={project.id}
                    onClick={() => {
                      if (isSelectable) {
                        onSelect(project.id);
                      }
                    }}
                    selected={selected}
                    disabled={!isSelectable}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: selected ? 'primary.light' : 'transparent',
                      backgroundColor: selected ? 'primary.main' : 'transparent',
                      color: selected ? 'primary.contrastText' : 'inherit',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: selected ? 'primary.main' : 'primary.light',
                        backgroundColor: selected ? 'primary.main' : 'primary.light',
                      },
                      '&.Mui-disabled': {
                        opacity: 0.65,
                        cursor: 'not-allowed',
                      },
                    }}
                  >
                    <ListItemText
                      primary={project.name}
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondary={
                        <Stack spacing={0.5} mt={1}>
                          {project.repositoryUrl ? (
                            <Typography component="span" variant="body2" color={selected ? 'inherit' : 'text.secondary'}>
                              Repository: {project.repositoryUrl}
                            </Typography>
                          ) : null}
                          {project.localPath ? (
                            <Typography component="span" variant="body2" color={selected ? 'inherit' : 'text.secondary'}>
                              Local path: {project.localPath}
                            </Typography>
                          ) : null}
                          {project.description ? (
                            <Typography component="span" variant="body2" color={selected ? 'inherit' : 'text.secondary'}>
                              {project.description}
                            </Typography>
                          ) : null}
                          {typeof project.promptCount === 'number' ? (
                            <Typography component="span" variant="body2" color={selected ? 'inherit' : 'text.secondary'}>
                              Prompts: {project.promptCount}
                            </Typography>
                          ) : null}
                          {warningMessage ? (
                            <Typography component="span" variant="body2" color={selected ? 'inherit' : 'warning.main'}>
                              {warningMessage}
                            </Typography>
                          ) : null}
                        </Stack>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          ) : null}

          {!isSelectTab && activeExtraTab ? (
            <Box>{activeExtraTab.content}</Box>
          ) : null}

          {isSelectTab && !isLoading && !hasProjects ? (
            <Typography color="text.secondary">No projects available. Create one to get started.</Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {onRefresh && isSelectTab ? (
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            data-testid="refresh-projects-dialog-button"
            sx={{ textTransform: 'uppercase', fontWeight: 700 }}
          >
            Refresh
          </Button>
        ) : null}
        <Button onClick={onClose} sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
