import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { 
  FileUp, 
  Library, 
  Clock, 
  Settings, 
  Trash2, 
  FileText, 
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PDFReader } from "@/components/PDFReader";
import { localStore, type RecentFile } from "@/lib/storage";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/utils";

export default function Home() {
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [activeFileMeta, setActiveFileMeta] = useState<{id: string; name: string; initialPage: number} | undefined>(undefined);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const { data: preferences } = usePreferences();

  useEffect(() => {
    setRecentFiles(localStore.getRecentFiles());
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === "application/pdf") {
      openFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false
  });

  const openFile = (file: File, meta?: { id: string, page: number }) => {
    // 1. Save to recent files metadata (not content)
    const fileRecord = localStore.addRecentFile({ name: file.name, size: file.size });
    
    // 2. Set active state to trigger reader
    setActiveFile(file);
    setActiveFileMeta(fileRecord ? {
      id: fileRecord.id,
      name: file.name,
      initialPage: meta?.page || fileRecord.lastPage || 1
    } : undefined);
  };

  const closeReader = () => {
    setActiveFile(null);
    setActiveFileMeta(undefined);
    // Refresh list to show updated progress
    setRecentFiles(localStore.getRecentFiles());
  };

  const removeRecent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = localStore.removeFile(id);
    setRecentFiles(updated);
  };

  // If reader is active, show it full screen
  if (activeFile) {
    return (
      <PDFReader 
        file={activeFile} 
        fileMeta={activeFileMeta}
        onClose={closeReader} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/10">
      
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Library className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-xl font-bold tracking-tight">PrivRead</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-border/50">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="hidden sm:inline">Offline & Private</span>
            </div>
            {/* Preferences could go here */}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-12">
        
        {/* Hero / Drop Zone */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl md:text-5xl font-serif font-semibold text-foreground">
              Your distraction-free reading space.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Secure, fast, and beautiful. PDF files are processed entirely in your browser and never sent to a server.
            </p>
          </div>

          <div 
            {...getRootProps()} 
            className={cn(
              "group relative overflow-hidden rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-card p-12 text-center transition-all duration-300 ease-out",
              isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "hover:border-primary/50 hover:bg-secondary/50"
            )}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center justify-center gap-4 relative z-10">
              <div className="p-4 rounded-full bg-secondary group-hover:bg-background shadow-sm transition-colors duration-300">
                <FileUp className="w-10 h-10 text-primary/80" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-medium">
                  {isDragActive ? "Drop to open" : "Drag & drop PDF here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse your files
                </p>
              </div>
              <Button className="mt-4 rounded-full px-8 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
                Open Document
              </Button>
            </div>
            
            {/* Decorative background gradients */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </section>

        {/* Recent Files Section */}
        {recentFiles.length > 0 && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <div className="flex items-center gap-2 border-b pb-4">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Recent Reads</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentFiles.map((file) => (
                <div 
                  key={file.id}
                  className="group relative bg-card hover:bg-secondary/40 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between h-[160px]"
                  // Note: Since we don't persist the Blob, we can't truly reopen without user re-selecting 
                  // In a real PWA we'd use File System Access API. 
                  // For now, this is a visual history that prompts user to re-select if needed, 
                  // OR we assume the user just dropped a file and we matched it to history.
                  // For this demo, clicking a history item without the file in memory won't work 
                  // unless we prompt for the file again. We'll add a visual indicator.
                  onClick={() => alert("For strict privacy without File System API, please drag this file in again to resume reading.")}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-primary/5 text-primary">
                        <FileText className="w-6 h-6" />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => removeRecent(e, file.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="font-medium truncate pr-4" title={file.name}>{file.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last read: {new Date(file.lastOpened).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Page {file.lastPage}</span>
                      {file.totalPageCount && <span>{Math.round((file.lastPage / file.totalPageCount) * 100)}%</span>}
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/80 rounded-full" 
                        style={{ width: `${file.totalPageCount ? (file.lastPage / file.totalPageCount) * 100 : 0}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Feature Highlights (Empty state filler) */}
        {recentFiles.length === 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            {[
              { 
                icon: ShieldCheck, 
                title: "Strictly Private", 
                desc: "Documents are processed locally in your browser memory. Nothing is ever uploaded." 
              },
              { 
                icon: FileText, 
                title: "Smart Rendering", 
                desc: "High-performance vector rendering ensures crisp text at any zoom level." 
              },
              { 
                icon: Settings, 
                title: "Reader Friendly", 
                desc: "Night mode, custom scaling, and ergonomic controls for long reading sessions." 
              }
            ].map((feature, i) => (
              <Card key={i} className="border-none shadow-none bg-secondary/20 hover:bg-secondary/40 transition-colors">
                <CardHeader>
                  <feature.icon className="w-10 h-10 text-primary/60 mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PrivRead. Designed for privacy.</p>
        </div>
      </footer>
    </div>
  );
}
