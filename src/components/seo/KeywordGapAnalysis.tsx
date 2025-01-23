import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function KeywordGapAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword Gap Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Analysis of keywords where competitors are ranking but your site is not.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Search Volume</TableHead>
                <TableHead>Competition</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Opportunity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Data will be populated by the edge function */}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}