import { useState } from "react";
import { Brain, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogUpload } from "@/components/upload/LogUpload";
import { AnalysisReport } from "./AnalysisReport";
import { LogAnalysis, AISettings, defaultAISettings } from "@/types/ai-settings";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export const LogAnalyzer = () => {
  const [settings] = useLocalStorage<AISettings>("citadel-ai-settings", defaultAISettings);
  const [analyses, setAnalyses] = useState<LogAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<LogAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getActiveProvider = () => {
    return settings.providers.find(
      p => p.id === settings.selectedProvider && p.enabled && (p.apiKey || p.id === "ollama")
    );
  };

  const analyzeWithAI = async (content: string, provider: typeof settings.providers[0]): Promise<Partial<LogAnalysis>> => {
    // Build the analysis prompt
    const systemPrompt = `You are a security and systems log analyst. Analyze the provided log content and return a JSON object with:
- summary: A brief 2-3 sentence summary of the log
- severityBreakdown: Object with counts for critical, warning, info, success
- insights: Array of 3-5 key insights about patterns, anomalies, or issues
- recommendations: Array of 2-4 actionable recommendations

Only return valid JSON, no markdown or explanations.`;

    const truncatedContent = content.slice(0, 15000); // Limit content size

    let apiUrl: string;
    let headers: Record<string, string>;
    let body: any;

    switch (provider.id) {
      case "openai":
        apiUrl = "https://api.openai.com/v1/chat/completions";
        headers = {
          "Authorization": `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        };
        body = {
          model: provider.model || "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this log:\n\n${truncatedContent}` },
          ],
          temperature: 0.3,
        };
        break;

      case "grok":
        apiUrl = "https://api.x.ai/v1/chat/completions";
        headers = {
          "Authorization": `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        };
        body = {
          model: provider.model || "grok-beta",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this log:\n\n${truncatedContent}` },
          ],
          temperature: 0.3,
        };
        break;

      case "deepseek":
        apiUrl = `${provider.baseUrl || "https://api.deepseek.com"}/chat/completions`;
        headers = {
          "Authorization": `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        };
        body = {
          model: provider.model || "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this log:\n\n${truncatedContent}` },
          ],
          temperature: 0.3,
        };
        break;

      case "ollama":
        apiUrl = `${provider.baseUrl || "http://localhost:11434"}/api/chat`;
        headers = { "Content-Type": "application/json" };
        body = {
          model: provider.model || "llama3.2",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this log:\n\n${truncatedContent}` },
          ],
          stream: false,
        };
        break;

      default:
        throw new Error("Unknown provider");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText.slice(0, 100)}`);
    }

    const data = await response.json();
    
    // Extract content based on provider format
    let content_response: string;
    if (provider.id === "ollama") {
      content_response = data.message?.content || "";
    } else {
      content_response = data.choices?.[0]?.message?.content || "";
    }

    // Parse JSON from response
    const jsonMatch = content_response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary,
      severityBreakdown: parsed.severityBreakdown,
      insights: parsed.insights,
      recommendations: parsed.recommendations,
    };
  };

  const handleUpload = async (file: File, content: string) => {
    const provider = getActiveProvider();
    
    if (!provider) {
      toast({
        title: "No AI Provider Configured",
        description: "Please configure an AI provider in settings first.",
        variant: "destructive",
      });
      return;
    }

    const newAnalysis: LogAnalysis = {
      id: Date.now().toString(),
      fileName: file.name,
      uploadedAt: new Date(),
      status: "analyzing",
      rawContent: content,
      provider: provider.name,
    };

    setAnalyses(prev => [newAnalysis, ...prev]);
    setSelectedAnalysis(newAnalysis);
    setIsAnalyzing(true);

    try {
      const result = await analyzeWithAI(content, provider);
      
      const completedAnalysis: LogAnalysis = {
        ...newAnalysis,
        status: "completed",
        ...result,
      };

      setAnalyses(prev => prev.map(a => a.id === newAnalysis.id ? completedAnalysis : a));
      setSelectedAnalysis(completedAnalysis);
      
      toast({
        title: "Analysis Complete",
        description: `${file.name} has been analyzed successfully.`,
      });
    } catch (error) {
      const errorAnalysis: LogAnalysis = {
        ...newAnalysis,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };

      setAnalyses(prev => prev.map(a => a.id === newAnalysis.id ? errorAnalysis : a));
      setSelectedAnalysis(errorAnalysis);

      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = (format: "json" | "txt") => {
    if (!selectedAnalysis) return;

    let content: string;
    let filename: string;

    if (format === "json") {
      content = JSON.stringify({
        fileName: selectedAnalysis.fileName,
        analyzedAt: selectedAnalysis.uploadedAt,
        provider: selectedAnalysis.provider,
        summary: selectedAnalysis.summary,
        severityBreakdown: selectedAnalysis.severityBreakdown,
        insights: selectedAnalysis.insights,
        recommendations: selectedAnalysis.recommendations,
      }, null, 2);
      filename = `${selectedAnalysis.fileName.replace(/\.[^/.]+$/, "")}-analysis.json`;
    } else {
      content = `CITADEL SYSLOG AI - Analysis Report
=====================================
File: ${selectedAnalysis.fileName}
Analyzed: ${selectedAnalysis.uploadedAt.toISOString()}
Provider: ${selectedAnalysis.provider}

SUMMARY
-------
${selectedAnalysis.summary}

SEVERITY BREAKDOWN
------------------
Critical: ${selectedAnalysis.severityBreakdown?.critical || 0}
Warning: ${selectedAnalysis.severityBreakdown?.warning || 0}
Info: ${selectedAnalysis.severityBreakdown?.info || 0}
Success: ${selectedAnalysis.severityBreakdown?.success || 0}

KEY INSIGHTS
------------
${selectedAnalysis.insights?.map((i, idx) => `${idx + 1}. ${i}`).join("\n") || "None"}

RECOMMENDATIONS
---------------
${selectedAnalysis.recommendations?.map((r, idx) => `${idx + 1}. ${r}`).join("\n") || "None"}
`;
      filename = `${selectedAnalysis.fileName.replace(/\.[^/.]+$/, "")}-analysis.txt`;
    }

    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: `Saved as ${filename}`,
    });
  };

  const deleteAnalysis = (id: string) => {
    setAnalyses(prev => prev.filter(a => a.id !== id));
    if (selectedAnalysis?.id === id) {
      setSelectedAnalysis(null);
    }
  };

  return (
    <div className="tactical-panel h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Log Analyzer</h2>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left: Upload & History */}
        <div className="w-72 border-r border-border flex flex-col">
          <div className="p-3">
            <LogUpload onUpload={handleUpload} isAnalyzing={isAnalyzing} />
          </div>

          <div className="flex-1 min-h-0">
            <div className="px-3 py-2 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
              <History className="w-3 h-3" />
              History
            </div>
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {analyses.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No analyses yet
                  </p>
                ) : (
                  analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className={cn(
                        "group p-2 rounded-md cursor-pointer transition-all flex items-center gap-2",
                        selectedAnalysis?.id === analysis.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-secondary/50"
                      )}
                      onClick={() => setSelectedAnalysis(analysis)}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        analysis.status === "completed" && "bg-success",
                        analysis.status === "analyzing" && "bg-warning animate-pulse",
                        analysis.status === "error" && "bg-critical",
                        analysis.status === "pending" && "bg-muted-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {analysis.fileName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {analysis.provider}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAnalysis(analysis.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right: Analysis Report */}
        <div className="flex-1 min-w-0">
          {selectedAnalysis ? (
            <AnalysisReport analysis={selectedAnalysis} onExport={handleExport} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Brain className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Upload a log file to start analysis
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
