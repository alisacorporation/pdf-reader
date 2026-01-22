import React, { useState, useEffect, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCw,
  Moon,
  Sun,
  Menu,
  X,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { localStore } from "@/lib/storage";

// Set worker manually for Vite
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  file: File | string; // File object or URL
  fileMeta?: { id: string; name: string; initialPage?: number };
  onClose: () => void;
}

export function PDFReader({ file, fileMeta, onClose }: PDFReaderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(fileMeta?.initialPage || 1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Container refs for auto-width
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    window.addEventListener('resize', updateWidth);
    updateWidth();
    
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    
    // If we have an ID, update the total page count in storage
    if (fileMeta?.id) {
       // Just update local progress hook if needed, but mainly we update progress on page change
    }
  }

  // Persist progress
  useEffect(() => {
    if (fileMeta?.id) {
      localStore.updateProgress(fileMeta.id, pageNumber);
    }
  }, [pageNumber, fileMeta?.id]);

  const changePage = (offset: number) => {
    setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages));
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col bg-background transition-colors duration-300", 
      isNightMode ? "dark" : ""
    )}>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-semibold truncate max-w-[200px] text-foreground/80 dark:text-foreground/90">
              {fileMeta?.name || "Document"}
            </span>
            <span className="text-xs text-muted-foreground/80 dark:text-muted-foreground/90">
              {numPages > 0 ? `${pageNumber} of ${numPages} pages` : "Loading..."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 bg-muted/50 dark:bg-muted/20 p-1 rounded-lg">
          <Button variant="ghost" size="icon" onClick={() => changePage(-1)} disabled={pageNumber <= 1} className="text-foreground/70 hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1 px-2">
            <Input 
              className="w-12 h-8 text-center px-1 bg-background/50 border-muted-foreground/20 text-foreground/80" 
              value={pageNumber} 
              onChange={handlePageInput}
            />
            <span className="text-sm text-muted-foreground/70 dark:text-muted-foreground/80 hidden sm:inline">/ {numPages}</span>
          </div>

          <Button variant="ghost" size="icon" onClick={() => changePage(1)} disabled={pageNumber >= numPages} className="text-foreground/70 hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 mr-2">
            <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="text-foreground/70">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-mono w-12 text-center text-foreground/70">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="text-foreground/70">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsNightMode(!isNightMode)}
            className={cn("transition-colors", isNightMode ? "text-yellow-400 hover:text-yellow-300" : "text-slate-600 hover:text-slate-900")}
          >
            {isNightMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={onClose} className="ml-2 text-foreground/70 hover:bg-destructive/10 hover:text-destructive">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar (Thumbnails / Outline placeholder) */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 z-20 w-64 bg-card border-r shadow-2xl transition-transform duration-300 ease-in-out transform",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Contents</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 text-sm text-muted-foreground">
            <p>Table of contents not available for this document.</p>
            {/* Future improvement: Extract outlines using pdfjs */}
          </div>
        </div>

        {/* PDF Viewer */}
        <div 
          ref={containerRef}
          className={cn(
            "flex-1 overflow-auto bg-muted/30 flex justify-center p-4 md:p-8 transition-colors duration-300",
            isNightMode ? "bg-[#1a1a1a]" : "bg-slate-100/50"
          )}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}

          <div className={cn(
            "shadow-xl transition-all duration-300 origin-top",
            isNightMode ? "pdf-night-mode" : ""
          )}>
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="h-[800px] w-[600px] bg-card animate-pulse rounded-lg" />}
              error={
                <div className="flex flex-col items-center justify-center h-full p-10 text-destructive">
                  <p className="font-semibold">Failed to load PDF.</p>
                  <p className="text-sm">The file might be corrupted or password protected.</p>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                rotate={rotation}
                width={Math.min(containerWidth - 64, 1000)} // Responsive width constraint
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="bg-white"
              />
            </Document>
          </div>
        </div>
        
        {/* Floating Rotation Control (Optional utility) */}
        <div className="absolute bottom-6 right-6 z-10">
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full shadow-lg h-12 w-12"
            onClick={() => setRotation(r => (r + 90) % 360)}
          >
            <RotateCw className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
