
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Settings, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function TechnicalSEOModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Technical SEO
        </CardTitle>
        <CardDescription>
          Site health and technical optimization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Score</span>
            <span className="font-medium">-/100</span>
          </div>
          <Progress value={0} className="h-2" />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <span>Site Speed</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <span>Mobile Friendly</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <span>Schema Markup</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <span>SSL Certificate</span>
          </div>
        </div>

        <Button className="w-full" variant="outline">
          Run Technical Audit
        </Button>
      </CardContent>
    </Card>
  );
}
