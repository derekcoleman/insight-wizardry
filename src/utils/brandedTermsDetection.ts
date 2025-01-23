export function isBrandedTerm(term: string, domain?: string): boolean {
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
  }
  
  // Common business-related terms that might appear with the brand
  const businessTerms = [
    'agency', 'company', 'inc', 'llc', 'ltd', 'group',
    'services', 'solutions', 'consulting', 'digital',
    'tech', 'technologies', 'software', 'systems',
    'media', 'marketing', 'creative', 'design',
    'web', 'online', 'global', 'international',
    'team', 'pro', 'professionals', 'experts'
  ];
  
  // Add variations with common business terms
  domainParts.forEach(part => {
    if (part.length >= 2) {
      businessTerms.forEach(term => {
        brandVariations.add(`${part} ${term}`);
        brandVariations.add(`${term} ${part}`);
      });
    }
  });
  
  // Clean up search term for comparison
  const normalizedTerm = term.toLowerCase();
  
  // Debug logging
  console.log('Domain:', domain);
  console.log('Clean domain:', cleanDomain);
  console.log('Domain parts:', domainParts);
  console.log('Brand variations:', Array.from(brandVariations));
  console.log('Search term:', term);
  console.log('Normalized term:', normalizedTerm);
  
  // Check if any brand variation is included in the search term
  return Array.from(brandVariations).some(variation => {
    const isMatch = normalizedTerm.includes(variation.toLowerCase());
    if (isMatch) {
      console.log('Matched variation:', variation);
    }
    return isMatch;
  });
}

export function analyzeBrandedTerms(searchTerms: Array<{
  term: string;
  current: { clicks: number };
  previous: { clicks: number };
}>, domain?: string) {
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