import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SearchTerm {
  term: string;
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

interface SearchTermsTableProps {
  searchTerms: SearchTerm[];
}

export function SearchTermsTable({ searchTerms }: SearchTermsTableProps) {
  if (!searchTerms || searchTerms.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Top Search Terms</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Search Term</TableHead>
            <TableHead className="text-right">Current Clicks</TableHead>
            <TableHead className="text-right">Previous Clicks</TableHead>
            <TableHead className="text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {searchTerms.map((term) => (
            <TableRow key={term.term}>
              <TableCell className="font-medium">{term.term}</TableCell>
              <TableCell className="text-right">{term.current.clicks}</TableCell>
              <TableCell className="text-right">{term.previous.clicks}</TableCell>
              <TableCell className={`text-right ${Number(term.changes.clicks) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(term.changes.clicks) >= 0 ? '↑' : '↓'} {Math.abs(Number(term.changes.clicks))}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}