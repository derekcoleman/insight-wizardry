import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SearchTermRowProps {
  term: string;
  isBranded: boolean;
  current: number;
  previous: number;
  change: number;
  paidData?: {
    spend: number;
    conversions: number;
    cpc: number;
  };
  isOpportunity?: boolean;
}

export function SearchTermRow({
  term,
  isBranded,
  current,
  previous,
  change,
  paidData,
  isOpportunity,
}: SearchTermRowProps) {
  return (
    <TableRow className={isOpportunity ? "bg-blue-50" : undefined}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {term}
          {isBranded && (
            <Badge 
              variant="secondary"
              className="bg-[#D6BCFA] text-[#7E69AB] hover:bg-[#D6BCFA]/80"
            >
              Branded
            </Badge>
          )}
          {isOpportunity && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Opportunity
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>High paid performance - opportunity for organic growth</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">{current}</TableCell>
      <TableCell className="text-right">{previous}</TableCell>
      <TableCell className={`text-right flex items-center justify-end gap-1`}>
        {change >= 0 ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
          {Math.abs(change)}%
        </span>
      </TableCell>
      {paidData && (
        <>
          <TableCell className="text-right">${paidData.spend.toLocaleString()}</TableCell>
          <TableCell className="text-right">{paidData.conversions}</TableCell>
          <TableCell className="text-right">${paidData.cpc.toFixed(2)}</TableCell>
        </>
      )}
    </TableRow>
  );
}