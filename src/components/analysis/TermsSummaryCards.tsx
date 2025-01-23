import { BrandedTermsCard } from "./BrandedTermsCard";

interface TermsSummaryCardsProps {
  brandedAnalysis: {
    terms: any[];
    percentage: number;
    clicks: number;
    change: number;
  };
  nonBrandedAnalysis: {
    terms: any[];
    percentage: number;
    clicks: number;
    change: number;
  };
}

export function TermsSummaryCards({ brandedAnalysis, nonBrandedAnalysis }: TermsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <BrandedTermsCard
        title="Branded Terms"
        titleColor="text-[#7E69AB]"
        badgeColor="bg-[#9b87f5]"
        badgeHoverColor="hover:bg-[#7E69AB]"
        backgroundColor="bg-[#F1F0FB]"
        borderColor="border-[#9b87f5]"
        terms={brandedAnalysis.terms.length}
        percentage={brandedAnalysis.percentage}
        clicks={brandedAnalysis.clicks}
        change={brandedAnalysis.change}
      />

      <BrandedTermsCard
        title="Non-Branded Terms"
        titleColor="text-gray-700"
        badgeColor="bg-gray-200"
        badgeHoverColor="hover:bg-gray-300"
        backgroundColor="bg-gray-50"
        borderColor="border-gray-200"
        terms={nonBrandedAnalysis.terms.length}
        percentage={nonBrandedAnalysis.percentage}
        clicks={nonBrandedAnalysis.clicks}
        change={nonBrandedAnalysis.change}
      />
    </div>
  );
}