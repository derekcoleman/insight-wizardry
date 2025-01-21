import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalysisInsightsProps {
  insights: string;
  isLoading: boolean;
}

export function AnalysisInsights({ insights, isLoading }: AnalysisInsightsProps) {
  if (isLoading) {
    return (
      <Card className="max-w-[75%] mx-auto">
        <CardHeader>
          <CardTitle>AI Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  // Split insights into Key Findings and Next Steps sections
  const sections = insights.split(/(?=Key Findings:|Recommended Next Steps:)/g);
  
  return (
    <Card className="max-w-[75%] mx-auto">
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          {sections.map((section, index) => {
            const [title, ...content] = section.trim().split('\n');
            return (
              <div key={index} className="mb-6">
                <h3 className="text-lg font-semibold mb-3 mt-0">{title.trim()}</h3>
                <ul className="list-disc pl-6 space-y-2">
                  {content
                    .filter(line => line.trim())
                    .map((line, i) => {
                      // Skip adding bullet points for lines that look like headers
                      const isHeader = line.trim().match(/^(Key Findings|Recommended Next Steps):/);
                      if (isHeader) {
                        return (
                          <h3 key={i} className="text-lg font-semibold mb-3 mt-4">
                            {line.trim()}
                          </h3>
                        );
                      }
                      return (
                        <li key={i}>
                          {line.trim()
                            .replace(/^[•-]\s*/, '')
                            .replace(/^[0-9]+\.\s*/, '')
                            .replace(/\*\*(.*?)\*\*/g, '$1')
                            .replace(/###\s*/, '')
                            .replace(/\[([^\]]+)\]/g, '$1')
                            .replace(/\(([^)]+)\)/g, '$1')
                            .replace(/`([^`]+)`/g, '$1')}
                        </li>
                      );
                    })}
                </ul>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}