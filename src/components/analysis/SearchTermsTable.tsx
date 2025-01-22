import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

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

function isBrandedTerm(term: string, domain?: string): boolean {
  if (!domain) return false;
  
  // Extract the domain name without TLD and prepare it for comparison
  const brandName = domain.split('.')[0].toLowerCase();
  
  // Create variations of the brand name
  const brandVariations = [
    brandName,
    // Handle cases where brand might be written with spaces
    ...brandName.split(/(?=[A-Z])/), // Split on capital letters
    brandName.replace(/([a-z])([A-Z])/g, '$1 $2'), // Add space between camelCase
  ].map(v => v.toLowerCase().trim());
  
  // Normalize the search term
  const normalizedTerm = term.toLowerCase();
  
  // Check if any variation of the brand name is in the term
  return brandVariations.some(variation => 
    normalizedTerm.includes(variation) || 
    // Also check if the term matches when spaces are removed
    normalizedTerm.replace(/\s+/g, '').includes(variation.replace(/\s+/g, ''))
  );
}

function analyzeBrandedTerms(searchTerms: SearchTerm[], domain?: string) {
  const branded = searchTerms.filter(term => isBrandedTerm(term.term, domain));
  const nonBranded = searchTerms.filter(term => !isBrandedTerm(term.term, domain));
  
  const brandedClicks = branded.reduce((sum, term) => sum + term.current.clicks, 0);
  const nonBrandedClicks = nonBranded.reduce((sum, term) => sum + term.current.clicks, 0);
  const totalClicks = brandedClicks + nonBrandedClicks;
  
  const brandedPrevClicks = branded.reduce((sum, term) => sum + term.previous.clicks, 0);
  const nonBrandedPrevClicks = nonBranded.reduce((sum, term) => sum + term.previous.clicks, 0);
  
  const brandedChange = brandedPrevClicks === 0 ? 0 : 
    ((brandedClicks - brandedPrevClicks) / brandedPrevClicks) * 100;
  const nonBrandedChange = nonBrandedPrevClicks === 0 ? 0 : 
    ((nonBrandedClicks - nonBrandedPrevClicks) / nonBrandedPrevClicks) * 100;

  return {
    branded: {
      terms: branded,
      clicks: brandedClicks,
      percentage: (brandedClicks / totalClicks) * 100,
      change: brandedChange
    },
    nonBranded: {
      terms: nonBranded,
      clicks: nonBrandedClicks,
      percentage: (nonBrandedClicks / totalClicks) * 100,
      change: nonBrandedChange
    }
  };
}

export function SearchTermsTable({ searchTerms, domain }: SearchTermsTableProps) {
  if (!searchTerms || searchTerms.length === 0) return null;

  const analysis = analyzeBrandedTerms(searchTerms, domain);

  return (
    <div className="mt-6 space-y-6">
      <h3 className="text-lg font-medium">Top Search Terms</h3>
      
      <Card className="p-4">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Branded Terms ({analysis.branded.percentage.toFixed(1)}%)</h4>
              <p className="text-sm text-muted-foreground">
                Total Clicks: {analysis.branded.clicks}
                <br />
                Change: {analysis.branded.change > 0 ? '+' : ''}{analysis.branded.change.toFixed(1)}%
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Non-Branded Terms ({analysis.nonBranded.percentage.toFixed(1)}%)</h4>
              <p className="text-sm text-muted-foreground">
                Total Clicks: {analysis.nonBranded.clicks}
                <br />
                Change: {analysis.nonBranded.change > 0 ? '+' : ''}{analysis.nonBranded.change.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
