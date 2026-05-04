import { create } from "zustand";

interface ArtifactState {
  isOpen: boolean;
  content: string | null;
  filePath: string | null;
  openArtifact: (content: string, filePath?: string) => void;
  closeArtifact: () => void;
}

export const useArtifactStore = create<ArtifactState>((set) => ({
  isOpen: false,
  content: null,
  filePath: null,
  openArtifact: (content, filePath) =>
    set({ isOpen: true, content, filePath }),
  closeArtifact: () => set({ isOpen: false, content: null, filePath: null }),
}));
