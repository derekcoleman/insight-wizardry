import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SearchTermRowProps {
  term: string;
  isBranded: boolean;
  current: number;
  previous: number;
  change: number;
}

export function SearchTermRow({
  term,
  isBranded,
  current,
  previous,
  change,
}: SearchTermRowProps) {
  return (
    <TableRow>
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
    </TableRow>
  );
}