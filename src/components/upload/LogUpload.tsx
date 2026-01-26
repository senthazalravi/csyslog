import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogAnalysis } from "@/types/ai-settings";

interface LogUploadProps {
  onUpload: (file: File, content: string) => void;
  isAnalyzing: boolean;
}

export const LogUpload = ({ onUpload, isAnalyzing }: LogUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    // Validate file type
    const validTypes = [".log", ".txt", ".json", ".csv", ".syslog"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!validTypes.includes(ext) && !file.type.startsWith("text/")) {
      setError("Please upload a log file (.log, .txt, .json, .csv, or .syslog)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    try {
      const content = await file.text();
      onUpload(file, content);
    } catch (err) {
      setError("Failed to read file");
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          isDragging && "border-primary bg-primary/10",
          isAnalyzing && "opacity-50 pointer-events-none",
          error && "border-critical/50"
        )}
      >
        <input
          type="file"
          accept=".log,.txt,.json,.csv,.syslog,text/*"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isAnalyzing}
        />
        
        <div className="flex flex-col items-center text-center">
          {isAnalyzing ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-sm font-medium text-foreground">Analyzing log file...</p>
              <p className="text-xs text-muted-foreground mt-1">AI is processing your logs</p>
            </>
          ) : (
            <>
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center mb-3",
                isDragging ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}>
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {isDragging ? "Drop your log file here" : "Upload log file for AI analysis"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop or click to browse • .log, .txt, .json, .csv
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-critical">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  );
};
