
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, AlertTriangle, Target, Lightbulb, Shield } from "lucide-react";

interface AnalysisInsightsProps {
  insights: string;
  isLoading: boolean;
}

export function AnalysisInsights({ insights, isLoading }: AnalysisInsightsProps) {
  if (isLoading) {
    return (
      <Card className="max-w-[75%] mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Strategic Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  // Parse the structured insights
  const sections = insights.split(/(?=\*\*[A-Z\s]+\*\*)/g).filter(section => section.trim());
  
  const getSectionIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('executive') || lowerTitle.includes('summary')) return <Target className="h-4 w-4" />;
    if (lowerTitle.includes('performance') || lowerTitle.includes('analysis')) return <TrendingUp className="h-4 w-4" />;
    if (lowerTitle.includes('findings') || lowerTitle.includes('critical')) return <AlertTriangle className="h-4 w-4" />;
    if (lowerTitle.includes('recommendations') || lowerTitle.includes('actionable')) return <Lightbulb className="h-4 w-4" />;
    if (lowerTitle.includes('risk') || lowerTitle.includes('assessment')) return <Shield className="h-4 w-4" />;
    return <Brain className="h-4 w-4" />;
  };

  const getSectionColor = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('executive') || lowerTitle.includes('summary')) return 'border-blue-200 bg-blue-50';
    if (lowerTitle.includes('performance') || lowerTitle.includes('analysis')) return 'border-green-200 bg-green-50';
    if (lowerTitle.includes('findings') || lowerTitle.includes('critical')) return 'border-amber-200 bg-amber-50';
    if (lowerTitle.includes('recommendations') || lowerTitle.includes('actionable')) return 'border-purple-200 bg-purple-50';
    if (lowerTitle.includes('risk') || lowerTitle.includes('assessment')) return 'border-red-200 bg-red-50';
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <Card className="max-w-[75%] mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Strategic Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map((section, index) => {
          const lines = section.trim().split('\n');
          const titleLine = lines[0];
          const content = lines.slice(1).filter(line => line.trim());
          
          // Extract title from markdown formatting
          const title = titleLine.replace(/\*\*/g, '').trim();
          
          if (!title) return null;
          
          return (
            <div key={index} className={`p-4 rounded-lg border-2 ${getSectionColor(title)}`}>
              <div className="flex items-center gap-2 mb-3">
                {getSectionIcon(title)}
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
              </div>
              
              <div className="space-y-2">
                {content.map((line, i) => {
                  const cleanLine = line.trim()
                    .replace(/^[•-]\s*/, '')
                    .replace(/^[0-9]+\.\s*/, '')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>');
                  
                  if (!cleanLine) return null;
                  
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p 
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: cleanLine }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
