import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalysisInsightsProps {
  insights: string;
  isLoading: boolean;
}

export function AnalysisInsights({ insights, isLoading }: AnalysisInsightsProps) {
  if (isLoading) {
    return (
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          {sections.map((section, index) => {
            const [title, ...content] = section.trim().split('\n');
            return (
              <div key={index} className="mb-6">
                <h3 className="text-lg font-semibold mb-3">{title}</h3>
                <ul className="list-disc pl-6 space-y-2">
                  {content
                    .filter(line => line.trim())
                    .map((line, i) => (
                      <li key={i}>{line.trim().replace(/^[•-]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')}</li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}