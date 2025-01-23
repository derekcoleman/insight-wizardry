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
import { BrandedTermsCard } from "./BrandedTermsCard";
import { SearchTermRow } from "./SearchTermsRow";
import { exportToCSV } from "@/utils/csvExport";

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
  
  // Clean up the domain and term for comparison
  const cleanDomain = domain.toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '') // Remove protocol and www
    .split('.')[0]; // Get first part of domain
  
  // Create brand variations
  const brandVariations = new Set<string>();
  
  // Add the full domain name
  brandVariations.add(cleanDomain);
  
  // Split domain into potential word combinations
  const domainParts = cleanDomain.match(/[a-z]+|\d+/g) || [];
  
  // Add individual parts if they're meaningful (2+ chars)
  domainParts.forEach(part => {
    if (part.length >= 2) {
      brandVariations.add(part);
    }
  });
  
  // Add combinations of consecutive parts
  for (let i = 0; i < domainParts.length - 1; i++) {
    brandVariations.add(domainParts[i] + domainParts[i + 1]);
    // Also add the parts separately if they're meaningful
    if (domainParts[i].length >= 2) brandVariations.add(domainParts[i]);
    if (domainParts[i + 1].length >= 2) brandVariations.add(domainParts[i + 1]);
  }
  
  // Common words to exclude
  const commonWords = new Set([
    'online', 'web', 'app', 'site', 'tech', 'digital',
    'service', 'services', 'group', 'inc', 'llc', 'ltd',
    'company', 'solutions', 'platform', 'software'
  ]);
  
  // Filter out common words
  const finalVariations = Array.from(brandVariations)
    .filter(v => !commonWords.has(v));
  
  // Clean up search term for comparison
  const normalizedTerm = term.toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  
  // Debug logging
  console.log('Domain:', domain);
  console.log('Clean domain:', cleanDomain);
  console.log('Domain parts:', domainParts);
  console.log('Brand variations:', finalVariations);
  console.log('Search term:', term);
  console.log('Normalized term:', normalizedTerm);
  
  // Check if any brand variation is included in the search term
  return finalVariations.some(variation => {
    const isMatch = normalizedTerm.includes(variation);
    if (isMatch) {
      console.log('Matched variation:', variation);
    }
    return isMatch;
  });
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BrandedTermsCard
          title="Branded Terms"
          titleColor="text-[#7E69AB]"
          badgeColor="bg-[#9b87f5]"
          badgeHoverColor="hover:bg-[#7E69AB]"
          backgroundColor="bg-[#F1F0FB]"
          borderColor="border-[#9b87f5]"
          terms={analysis.branded.terms.length}
          percentage={analysis.branded.percentage}
          clicks={analysis.branded.clicks}
          change={analysis.branded.change}
        />

        <BrandedTermsCard
          title="Non-Branded Terms"
          titleColor="text-gray-700"
          badgeColor="bg-gray-200"
          badgeHoverColor="hover:bg-gray-300"
          backgroundColor="bg-gray-50"
          borderColor="border-gray-200"
          terms={analysis.nonBranded.terms.length}
          percentage={analysis.nonBranded.percentage}
          clicks={analysis.nonBranded.clicks}
          change={analysis.nonBranded.change}
        />
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