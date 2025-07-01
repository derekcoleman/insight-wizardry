
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, AlertTriangle, Target, Lightbulb, Eye, Globe } from "lucide-react";

interface AnalysisInsightsProps {
  insights: string;
  isLoading: boolean;
}

export function AnalysisInsights({ insights, isLoading }: AnalysisInsightsProps) {
  if (isLoading) {
    return (
      <Card className="max-w-[75%] mx-auto bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Brain className="h-5 w-5 text-gray-600" />
            AI Strategic Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <Globe className="h-4 w-4 animate-spin" />
            <span className="text-sm">Crawling sitemap and analyzing content freshness...</span>
          </div>
          <Skeleton className="h-4 w-full bg-gray-100" />
          <Skeleton className="h-4 w-3/4 bg-gray-100" />
          <Skeleton className="h-4 w-5/6 bg-gray-100" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/2 bg-gray-100" />
            <Skeleton className="h-4 w-full bg-gray-100" />
            <Skeleton className="h-4 w-4/5 bg-gray-100" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3 bg-gray-100" />
            <Skeleton className="h-4 w-full bg-gray-100" />
            <Skeleton className="h-4 w-3/4 bg-gray-100" />
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Generating LLM Optimization Recommendations...</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Analyzing page freshness, content structure, and AI ranking factors
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="max-w-[75%] mx-auto bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Brain className="h-5 w-5 text-gray-600" />
            AI Strategic Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Analysis in progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parse the structured insights
  const sections = insights.split(/(?=\*\*[A-Z\s]+\*\*)/g).filter(section => section.trim());
  
  const getSectionIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('executive') || lowerTitle.includes('summary')) return <Target className="h-4 w-4 text-gray-600" />;
    if (lowerTitle.includes('performance') || lowerTitle.includes('metrics')) return <TrendingUp className="h-4 w-4 text-gray-600" />;
    if (lowerTitle.includes('findings') || lowerTitle.includes('critical')) return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    if (lowerTitle.includes('recommendations')) return <Lightbulb className="h-4 w-4 text-gray-600" />;
    if (lowerTitle.includes('observations') || lowerTitle.includes('strategic')) return <Eye className="h-4 w-4 text-gray-600" />;
    if (lowerTitle.includes('llm') || lowerTitle.includes('optimization')) return <Globe className="h-4 w-4 text-blue-600" />;
    return <Brain className="h-4 w-4 text-gray-600" />;
  };

  const getSectionBgColor = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('llm') || lowerTitle.includes('optimization')) return 'bg-blue-50 border-blue-200';
    return 'bg-gray-50 border-gray-100';
  };

  return (
    <Card className="max-w-[75%] mx-auto bg-white border-gray-200">
      <CardHeader className="bg-gray-50">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Brain className="h-5 w-5 text-gray-600" />
          AI Strategic Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {sections.map((section, index) => {
          const lines = section.trim().split('\n');
          const titleLine = lines[0];
          const content = lines.slice(1).filter(line => line.trim());
          
          // Extract title from markdown formatting
          const title = titleLine.replace(/\*\*/g, '').trim();
          
          if (!title) return null;
          
          return (
            <div key={index} className={`p-4 rounded-lg border ${getSectionBgColor(title)}`}>
              <div className="flex items-center gap-2 mb-3">
                {getSectionIcon(title)}
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
