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
          {sections.map((section, index) => (
            <div key={index} className="mb-6">
              <div className="whitespace-pre-wrap">{section.trim()}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}