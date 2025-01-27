import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "./MetricCard";
import { SearchTermsTable } from "./SearchTermsTable";
import { TopPagesTable } from "./TopPagesTable";
import { ProductPerformanceTable } from "./ProductPerformanceTable";
import { TrendsAnalysis } from "./TrendsAnalysis";

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
    pages?: any[];
    domain?: string;
  };
  channelName?: string;
}

export function AnalysisCard({ title, dateRange, data, channelName = 'Overall' }: AnalysisCardProps) {
  const shouldShowSearchConsoleData = channelName === 'Overall' || channelName === 'Organic Search';
  const keywords = data.searchTerms?.map(term => term.term) || [];

  return (
    <Card className="max-w-[75%] mx-auto">
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
            {shouldShowSearchConsoleData && data.dataSources?.gsc && (
              <Badge variant="secondary">Search Console</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              title="Sessions"
              value={data.current.sessions}
              change={data.changes.sessions}
              channel={channelName}
            />
            <MetricCard
              title={formatEventName(data.current.conversionGoal || 'Conversions')}
              value={data.current.conversions}
              change={data.changes.conversions}
              channel={channelName}
            />
            <MetricCard
              title="Revenue"
              value={data.current.revenue}
              change={data.changes.revenue}
              suffix="$"
              channel={channelName}
            />
          </div>
          {data.summary && shouldShowSearchConsoleData && (
            <div className="text-sm text-muted-foreground mt-4 whitespace-pre-line">
              {data.summary}
            </div>
          )}
          {data.current.products?.current && data.current.products.current.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-2">Top Products</h3>
              <ProductPerformanceTable products={data.current.products} />
            </>
          )}
          {shouldShowSearchConsoleData && data.searchTerms && (
            <SearchTermsTable searchTerms={data.searchTerms} domain={data.domain} />
          )}
          {shouldShowSearchConsoleData && data.pages && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-2">Top Pages</h3>
              <TopPagesTable pages={data.pages} />
            </>
          )}
          {shouldShowSearchConsoleData && keywords.length > 0 && (
            <TrendsAnalysis keywords={keywords} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const formatEventName = (eventName: string): string => {
  if (eventName === 'Total Events') return eventName;
  return eventName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};