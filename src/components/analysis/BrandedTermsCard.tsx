import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface BrandedTermsCardProps {
  title: string;
  titleColor: string;
  badgeColor: string;
  badgeHoverColor: string;
  backgroundColor: string;
  borderColor: string;
  terms: number;
  percentage: number;
  clicks: number;
  change: number;
}

export function BrandedTermsCard({
  title,
  titleColor,
  badgeColor,
  badgeHoverColor,
  backgroundColor,
  borderColor,
  terms,
  percentage,
  clicks,
  change,
}: BrandedTermsCardProps) {
  return (
    <Card className={`${backgroundColor} border-${borderColor}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className={`text-lg font-semibold ${titleColor}`}>{title}</h4>
            <p className="text-sm text-gray-600">
              {percentage.toFixed(1)}% of total clicks
            </p>
          </div>
          <Badge 
            className={`${badgeColor} hover:${badgeHoverColor}`}
            variant="secondary"
          >
            {terms} terms
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Clicks</span>
            <span className={`text-lg font-bold ${titleColor}`}>{clicks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Change</span>
            <div className="flex items-center gap-1">
              {change > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}