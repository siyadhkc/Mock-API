import { create } from 'zustand'
import type { Workspace } from '../api/workspaces'

interface WorkspaceState {
  activeWorkspace: Workspace | null
  setActiveWorkspace: (ws: Workspace | null) => void
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  activeWorkspace: null,
  setActiveWorkspace: (ws) => set({ activeWorkspace: ws }),
}))
