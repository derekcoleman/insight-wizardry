
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Globe } from 'lucide-react';

export function OverviewModule() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Overview
        </CardTitle>
        <CardDescription>
          Key performance metrics at a glance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600">Conversions</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600">Avg. Position</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-sm text-gray-600">SEO Score</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
