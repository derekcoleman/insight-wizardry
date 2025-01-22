import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PageData {
  path: string;
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
  pages: PageData[];
}

export function TopPagesTable({ pages }: TopPagesTableProps) {
  if (!pages || pages.length === 0) return null;

  const getPerformanceBadge = (page: PageData) => {
    const currentCTR = parseFloat(page.current.ctr);
    const currentPosition = parseFloat(page.current.position);
    const currentImpressions = page.current.impressions;
    const clicksChange = parseFloat(page.changes.clicks);

    if (currentImpressions > 1000 && currentCTR < 1) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="ml-2">
                Low CTR <Info className="h-3 w-3 ml-1 inline" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              High impressions but low click-through rate
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (currentPosition > 10 && currentImpressions > 500) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="ml-2">
                Poor Position <Info className="h-3 w-3 ml-1 inline" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              High impressions but low search position
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (clicksChange < -20) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="ml-2">
                Declining <Info className="h-3 w-3 ml-1 inline" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Significant decrease in clicks
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (clicksChange > 20) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="ml-2">
                Growing <Info className="h-3 w-3 ml-1 inline" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Significant increase in clicks
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return null;
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Top Pages by Organic Clicks</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page Path</TableHead>
            <TableHead className="text-right">Current Clicks</TableHead>
            <TableHead className="text-right">Previous Clicks</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Position</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.path}>
              <TableCell className="font-medium">
                {page.path}
                {getPerformanceBadge(page)}
              </TableCell>
              <TableCell className="text-right">{page.current.clicks}</TableCell>
              <TableCell className="text-right">{page.previous.clicks}</TableCell>
              <TableCell className={`text-right ${Number(page.changes.clicks) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(page.changes.clicks) >= 0 ? '↑' : '↓'} {Math.abs(Number(page.changes.clicks))}%
              </TableCell>
              <TableCell className="text-right">{page.current.ctr}%</TableCell>
              <TableCell className="text-right">{page.current.position}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}