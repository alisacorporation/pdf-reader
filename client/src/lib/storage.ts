// Client-side storage for strict privacy
// We only store metadata (filename, lastPage, date), NEVER the file content or Blob

export interface RecentFile {
  id: string;
  name: string;
  lastOpened: number;
  lastPage: number;
  totalPageCount?: number;
  size: number;
}

const STORAGE_KEY = "read_private_recent_files";

export const localStore = {
  getRecentFiles: (): RecentFile[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to read recent files", e);
      return [];
    }
  },

  addRecentFile: (file: { name: string; size: number }, pageCount?: number) => {
    try {
      const files = localStore.getRecentFiles();
      // Generate a simple ID based on name+size (simple hash for uniqueness without content)
      const id = btoa(`${file.name}-${file.size}`);
      
      const newFile: RecentFile = {
        id,
        name: file.name,
        size: file.size,
        lastOpened: Date.now(),
        lastPage: 1,
        totalPageCount: pageCount
      };

      // Remove duplicates, keep latest
      const filtered = files.filter(f => f.id !== id);
      const updated = [newFile, ...filtered].slice(0, 10); // Keep last 10

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newFile;
    } catch (e) {
      console.error("Failed to save recent file", e);
      return null;
    }
  },

  updateProgress: (fileId: string, page: number) => {
    try {
      const files = localStore.getRecentFiles();
      const updated = files.map(f => {
        if (f.id === fileId) {
          return { ...f, lastPage: page, lastOpened: Date.now() };
        }
        return f;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to update progress", e);
    }
  },
  
  removeFile: (fileId: string) => {
    try {
      const files = localStore.getRecentFiles();
      const updated = files.filter(f => f.id !== fileId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Failed to remove file", e);
      return [];
    }
  }
};
