import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  
  // Extract domain name without TLD and common suffixes
  const domainParts = domain.toLowerCase().split('.');
  const brandName = domainParts[0]
    .replace(/\.(com|net|org|io|co|inc)$/, '')
    .replace(/[^a-z0-9]/g, '');
  
  console.log('Processing domain:', domain);
  console.log('Extracted brand name:', brandName);
  
  // Create brand name variations
  const brandVariations = new Set<string>();
  
  // Add the full brand name
  brandVariations.add(brandName);
  
  // Split by common word boundaries and add individual parts
  const parts = brandName.match(/[a-z]+/g) || [];
  parts.forEach(part => {
    if (part.length >= 3) {
      brandVariations.add(part);
    }
  });
  
  // Add combinations of consecutive parts
  for (let i = 0; i < parts.length - 1; i++) {
    brandVariations.add(parts[i] + parts[i + 1]);
  }
  
  // Filter out common words and short terms
  const commonWords = new Set([
    'online', 'web', 'app', 'site', 'tech', 'digital',
    'service', 'services', 'group', 'inc', 'llc', 'ltd',
    'company', 'solutions', 'platform', 'software'
  ]);
  
  const finalVariations = Array.from(brandVariations)
    .filter(v => !commonWords.has(v) && v.length >= 3);
  
  console.log('Brand variations:', finalVariations);
  
  // Normalize search term
  const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9]/g, '');
  console.log('Checking term:', term);
  console.log('Normalized term:', normalizedTerm);
  
  // Check if any brand variation is present in the term
  const isBranded = finalVariations.some(variation => {
    const isMatch = normalizedTerm.includes(variation);
    if (isMatch) {
      console.log(`Match found: "${variation}" in "${normalizedTerm}"`);
    }
    return isMatch;
  });
  
  console.log(`Term "${term}" is ${isBranded ? 'branded' : 'non-branded'}\n`);
  return isBranded;
}

function analyzeBrandedTerms(searchTerms: SearchTerm[], domain?: string) {
  console.log('Analyzing branded terms for domain:', domain);
  console.log('Total search terms:', searchTerms.length);
  
  const branded = searchTerms.filter(term => isBrandedTerm(term.term, domain));
  const nonBranded = searchTerms.filter(term => !isBrandedTerm(term.term, domain));
  
  console.log('Branded terms count:', branded.length);
  console.log('Non-branded terms count:', nonBranded.length);
  
  const brandedClicks = branded.reduce((sum, term) => sum + term.current.clicks, 0);
  const nonBrandedClicks = nonBranded.reduce((sum, term) => sum + term.current.clicks, 0);
  const totalClicks = brandedClicks + nonBrandedClicks;
  
  const brandedPrevClicks = branded.reduce((sum, term) => sum + term.previous.clicks, 0);
  const nonBrandedPrevClicks = nonBranded.reduce((sum, term) => sum + term.previous.clicks, 0);
  
  const brandedChange = brandedPrevClicks === 0 ? 0 : 
    ((brandedClicks - brandedPrevClicks) / brandedPrevClicks) * 100;
  const nonBrandedChange = nonBrandedPrevClicks === 0 ? 0 : 
    ((nonBrandedClicks - nonBrandedPrevClicks) / nonBrandedPrevClicks) * 100;

  console.log('Analysis results:', {
    brandedClicks,
    nonBrandedClicks,
    totalClicks,
    brandedPercentage: totalClicks === 0 ? 0 : (brandedClicks / totalClicks) * 100,
    nonBrandedPercentage: totalClicks === 0 ? 0 : (nonBrandedClicks / totalClicks) * 100
  });

  return {
    branded: {
      terms: branded,
      clicks: brandedClicks,
      percentage: totalClicks === 0 ? 0 : (brandedClicks / totalClicks) * 100,
      change: brandedChange
    },
    nonBranded: {
      terms: nonBranded,
      clicks: nonBrandedClicks,
      percentage: totalClicks === 0 ? 0 : (nonBrandedClicks / totalClicks) * 100,
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
              <TableCell className="font-medium">
                {term.term}
                {isBrandedTerm(term.term, domain) && (
                  <span className="ml-2 text-xs text-muted-foreground">(Branded)</span>
                )}
              </TableCell>
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