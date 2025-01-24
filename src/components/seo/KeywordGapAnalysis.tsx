import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";

interface KeywordGapAnalysisProps {
  analysisData: any;
}

export function KeywordGapAnalysis({ analysisData }: KeywordGapAnalysisProps) {
  if (!analysisData) return null;

  // Get pages with declining performance
  const getDeclinePages = () => {
    const monthlyPages = analysisData.monthly_analysis?.pages || [];
    return monthlyPages
      .filter((page: any) => {
        const clicksChange = parseFloat(page.changes.clicks);
        return clicksChange < 0;
      })
      .sort((a: any, b: any) => {
        return parseFloat(a.changes.clicks) - parseFloat(b.changes.clicks);
      })
      .slice(0, 10);
  };

  // Get pages with opportunity (high impressions, low CTR)
  const getOpportunityPages = () => {
    const monthlyPages = analysisData.monthly_analysis?.pages || [];
    return monthlyPages
      .filter((page: any) => {
        const ctr = parseFloat(page.current.ctr);
        const impressions = parseInt(page.current.impressions);
        return ctr < 3 && impressions > 1000;
      })
      .sort((a: any, b: any) => {
        return parseInt(b.current.impressions) - parseInt(a.current.impressions);
      })
      .slice(0, 10);
  };

  const getPageConversions = (pagePath: string) => {
    const pageConversions = analysisData.monthly_analysis?.current?.pageConversions;
    if (!pageConversions) return 0;
    
    // Clean the URL path for comparison
    const cleanPath = new URL(pagePath).pathname;
    return pageConversions.get(cleanPath) || 0;
  };

  const declinePages = getDeclinePages();
  const opportunityPages = getOpportunityPages();
  const conversionGoal = analysisData.monthly_analysis?.current?.conversionGoal || 'Total Conversions';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Performance Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {declinePages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
                Pages with Declining Traffic
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Traffic Change</TableHead>
                    <TableHead className="text-right">Current Position</TableHead>
                    <TableHead className="text-right">Journey {conversionGoal}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declinePages.map((page: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new URL(page.page).pathname}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        {page.changes.clicks}%
                      </TableCell>
                      <TableCell className="text-right">
                        {page.current.position}
                      </TableCell>
                      <TableCell className="text-right">
                        {getPageConversions(page.page)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {opportunityPages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                Pages with Optimization Potential
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Current CTR</TableHead>
                    <TableHead className="text-right">Journey {conversionGoal}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunityPages.map((page: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new URL(page.page).pathname}
                      </TableCell>
                      <TableCell className="text-right">
                        {parseInt(page.current.impressions).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={parseFloat(page.current.ctr) < 1 ? "destructive" : "secondary"}>
                          {page.current.ctr}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {getPageConversions(page.page)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {declinePages.length === 0 && opportunityPages.length === 0 && (
            <p className="text-muted-foreground">
              No significant content performance issues detected in the current analysis period.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}