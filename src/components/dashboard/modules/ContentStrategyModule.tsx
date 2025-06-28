
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PenTool, Target, TrendingUp } from 'lucide-react';

export function ContentStrategyModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Content Strategy
        </CardTitle>
        <CardDescription>
          AI-powered content recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-sm">Keyword Opportunities</span>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              Connect your analytics to discover new keyword opportunities
            </div>
            <Badge variant="secondary" className="text-xs">
              Pending Analysis
            </Badge>
          </div>
          
          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium text-sm">Content Gaps</span>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              Identify content gaps based on competitor analysis
            </div>
            <Badge variant="secondary" className="text-xs">
              Pending Analysis
            </Badge>
          </div>
        </div>

        <Button className="w-full" variant="outline">
          Generate Strategy
        </Button>
      </CardContent>
    </Card>
  );
}
