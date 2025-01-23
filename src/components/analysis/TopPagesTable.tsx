import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const getPerformanceBadge = (metrics: PageMetrics["current"]) => {
    const ctr = parseFloat(metrics.ctr);
    const position = parseFloat(metrics.position);
    const impressions = metrics.impressions;

    if (ctr < 1 && impressions > 1000 && position > 10) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="ml-2 whitespace-nowrap">
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
              <Badge variant="success" className="ml-2 whitespace-nowrap">
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
    <div className="rounded-md border mt-4 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Page</TableHead>
              <TableHead className="text-right whitespace-nowrap">Current Clicks</TableHead>
              <TableHead className="text-right whitespace-nowrap">Previous Clicks</TableHead>
              <TableHead className="text-right whitespace-nowrap">Change</TableHead>
              <TableHead className="text-right whitespace-nowrap">CTR</TableHead>
              <TableHead className="text-right whitespace-nowrap">Position</TableHead>
              <TableHead className="min-w-[140px]">Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium min-w-[200px] break-words">
                  {page.page}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {page.current.clicks.toLocaleString()}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {page.previous.clicks.toLocaleString()}
                </TableCell>
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