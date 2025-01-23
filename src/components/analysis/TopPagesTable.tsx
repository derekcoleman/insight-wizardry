import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { exportToCSV } from "@/utils/csvExport";

interface PageMetrics {
  page: string;
  current: {
    clicks: number;
    impressions: number;
    ctr: string;
    position: string;
  };
  previous: {
    clicks: number;
    impressions: number;
    ctr: string;
    position: string;
  };
  changes: {
    clicks: string;
    impressions: string;
    ctr: string;
    position: string;
  };
}

interface TopPagesTableProps {
  pages: PageMetrics[];
}

export function TopPagesTable({ pages }: TopPagesTableProps) {
  if (!pages || pages.length === 0) return null;

  const handleExportCSV = () => {
    const csvData = pages.map(page => ({
      'Page': page.page,
      'Current Clicks': page.current.clicks,
      'Previous Clicks': page.previous.clicks,
      'Change (%)': page.changes.clicks,
      'CTR (%)': page.current.ctr,
      'Position': page.current.position
    }));
    
    exportToCSV(csvData, 'top-pages-analysis');
  };

  const getPerformanceBadge = (metrics: PageMetrics["current"]) => {
    const ctr = parseFloat(metrics.ctr);
    const position = parseFloat(metrics.position);
    const impressions = metrics.impressions;

    if (ctr < 1 && impressions > 1000 && position > 10) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="ml-2">
                <Info className="h-3 w-3 mr-1" />
                Underperforming
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>High impressions but low CTR and poor position</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (ctr > 5 && position <= 10) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="success" className="ml-2">
                <Info className="h-3 w-3 mr-1" />
                Top Performer
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Good CTR and position</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return null;
  };

  const getChangeColor = (change: string) => {
    const value = parseFloat(change);
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Top Pages</h3>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Page</TableHead>
              <TableHead className="text-right">Current Clicks</TableHead>
              <TableHead className="text-right">Previous Clicks</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Position</TableHead>
              <TableHead>Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium break-words">{page.page}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{page.current.clicks.toLocaleString()}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{page.previous.clicks.toLocaleString()}</TableCell>
                <TableCell className={`text-right whitespace-nowrap ${getChangeColor(page.changes.clicks)}`}>
                  {parseFloat(page.changes.clicks) > 0 ? "+" : ""}
                  {page.changes.clicks}%
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">{page.current.ctr}%</TableCell>
                <TableCell className="text-right whitespace-nowrap">{page.current.position}</TableCell>
                <TableCell>{getPerformanceBadge(page.current)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}