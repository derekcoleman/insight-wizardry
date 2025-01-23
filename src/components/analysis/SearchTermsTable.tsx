import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "lucide-react";

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
      <h3 className="text-lg font-medium text-gray-900">Top Search Terms</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#F1F0FB] border-[#9b87f5]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-[#7E69AB]">Branded Terms</h4>
                <p className="text-sm text-gray-600">
                  {analysis.branded.percentage.toFixed(1)}% of total clicks
                </p>
              </div>
              <Badge 
                className="bg-[#9b87f5] hover:bg-[#7E69AB]"
                variant="secondary"
              >
                {analysis.branded.terms.length} terms
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Clicks</span>
                <span className="text-lg font-bold text-[#7E69AB]">{analysis.branded.clicks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Change</span>
                <div className="flex items-center gap-1">
                  {analysis.branded.change > 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`font-medium ${analysis.branded.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(analysis.branded.change).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-700">Non-Branded Terms</h4>
                <p className="text-sm text-gray-600">
                  {analysis.nonBranded.percentage.toFixed(1)}% of total clicks
                </p>
              </div>
              <Badge 
                variant="secondary"
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                {analysis.nonBranded.terms.length} terms
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Clicks</span>
                <span className="text-lg font-bold text-gray-900">{analysis.nonBranded.clicks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Change</span>
                <div className="flex items-center gap-1">
                  {analysis.nonBranded.change > 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`font-medium ${analysis.nonBranded.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(analysis.nonBranded.change).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          {searchTerms.map((term) => {
            const isBranded = isBrandedTerm(term.term, domain);
            return (
              <TableRow key={term.term}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {term.term}
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
                <TableCell className="text-right">{term.current.clicks}</TableCell>
                <TableCell className="text-right">{term.previous.clicks}</TableCell>
                <TableCell className={`text-right flex items-center justify-end gap-1`}>
                  {Number(term.changes.clicks) >= 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span className={Number(term.changes.clicks) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(Number(term.changes.clicks))}%
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
