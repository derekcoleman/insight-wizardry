
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleConnect } from '@/components/GoogleConnect';
import { Activity } from 'lucide-react';

export function PerformanceModule() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Analytics
        </CardTitle>
        <CardDescription>
          Connect your Google Analytics and Search Console for comprehensive insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleConnect />
      </CardContent>
    </Card>
  );
}
