import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { SearchTermRow } from "./SearchTermsRow";
import { TermsSummaryCards } from "./TermsSummaryCards";
import { exportToCSV } from "@/utils/csvExport";
import { isBrandedTerm, analyzeBrandedTerms } from "@/utils/brandedTermsDetection";

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
  domain?: string;
}

export function SearchTermsTable({ searchTerms, domain }: SearchTermsTableProps) {
  if (!searchTerms || searchTerms.length === 0) return null;

  const analysis = analyzeBrandedTerms(searchTerms, domain);

  const handleExportCSV = () => {
    const csvData = searchTerms.map(term => ({
      'Search Term': term.term,
      'Current Clicks': term.current.clicks,
      'Previous Clicks': term.previous.clicks,
      'Change (%)': term.changes.clicks,
      'Current CTR (%)': term.current.ctr,
      'Current Position': term.current.position,
      'Is Branded': isBrandedTerm(term.term, domain) ? 'Yes' : 'No'
    }));
    
    exportToCSV(csvData, 'search-terms-analysis');
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Top Search Terms</h3>
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
      
      <TermsSummaryCards 
        brandedAnalysis={analysis.branded}
        nonBrandedAnalysis={analysis.nonBranded}
      />

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
            <SearchTermRow
              key={term.term}
              term={term.term}
              isBranded={isBrandedTerm(term.term, domain)}
              current={term.current.clicks}
              previous={term.previous.clicks}
              change={Number(term.changes.clicks)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}