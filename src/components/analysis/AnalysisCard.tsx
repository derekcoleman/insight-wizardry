import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "./MetricCard";
import { SearchTermsTable } from "./SearchTermsTable";

interface AnalysisCardProps {
  title: string;
  dateRange: string;
  data: {
    current: any;
    previous: any;
    changes: any;
    summary?: string;
    dataSources?: {
      ga4?: boolean;
      gsc?: boolean;
    };
    searchTerms?: any[];
  };
}

export function AnalysisCard({ title, dateRange, data }: AnalysisCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {dateRange && (
              <p className="text-sm text-muted-foreground mt-2">
                {dateRange}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {data.dataSources?.ga4 && (
              <Badge variant="secondary">GA4</Badge>
            )}
            {data.dataSources?.gsc && (
              <Badge variant="secondary">Search Console</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              title="Organic Sessions"
              value={data.current.sessions}
              change={data.changes.sessions}
              source={data.current.source}
            />
            <MetricCard
              title={`Organic ${data.current.conversionGoal || 'Conversions'}`}
              value={data.current.conversions}
              change={data.changes.conversions}
              source={data.current.source}
            />
            <MetricCard
              title="Organic Revenue"
              value={data.current.revenue}
              change={data.changes.revenue}
              suffix="$"
              source={data.current.source}
            />
          </div>
          {data.summary && (
            <div className="text-sm text-muted-foreground mt-4 whitespace-pre-line">
              {data.summary}
            </div>
          )}
          {data.searchTerms && <SearchTermsTable searchTerms={data.searchTerms} />}
        </div>
      </CardContent>
    </Card>
  );
}