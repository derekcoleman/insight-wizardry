import { Summary } from "@/components/Summary";
import { GoogleConnect } from "@/components/GoogleConnect";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, TrendingDown, TrendingUp, Users, Share2, Target, Megaphone, Search } from "lucide-react";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
  };

  const GrowthMetricCard = ({ title, metric, change, icon: Icon }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metric}</div>
        <div className={`flex items-center text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
          <span>{Math.abs(change)}%</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section - Only show when not connected */}
      {!isConnected && (
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Complete Growth</span>
                <span className="block text-blue-600">Analytics Platform</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Comprehensive analytics across all growth channels - SEO, Paid Social, Organic Social, PPC, and overall growth metrics in one place.
              </p>
              <div className="mt-10">
                <GoogleConnect onConnectionChange={handleConnectionChange} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard - Show when connected */}
      {isConnected && (
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Growth Dashboard</h2>
          </div>
          
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <GrowthMetricCard
              title="Total Traffic"
              metric="24.2k"
              change={12}
              icon={Users}
            />
            <GrowthMetricCard
              title="Conversion Rate"
              metric="2.4%"
              change={-4}
              icon={Target}
            />
            <GrowthMetricCard
              title="Social Engagement"
              metric="1.2k"
              change={28}
              icon={Share2}
            />
            <GrowthMetricCard
              title="Ad Performance"
              metric="3.2"
              change={12}
              icon={LineChart}
            />
          </div>

          {/* Channel Tabs */}
          <Tabs defaultValue={activeTab} className="space-y-4" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="seo">
                <Search className="w-4 h-4 mr-2" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="paid-social">
                <Megaphone className="w-4 h-4 mr-2" />
                Paid Social
              </TabsTrigger>
              <TabsTrigger value="organic-social">
                <Share2 className="w-4 h-4 mr-2" />
                Organic Social
              </TabsTrigger>
              <TabsTrigger value="ppc">
                <Target className="w-4 h-4 mr-2" />
                PPC
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab Content */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Channel Distribution</CardTitle>
                    <CardDescription>Traffic distribution across channels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* We'll add charts here in the next iteration */}
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      Channel distribution visualization coming soon
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                    <CardDescription>User journey and conversion points</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      Conversion funnel visualization coming soon
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Score</CardTitle>
                    <CardDescription>Overall growth performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      Growth score visualization coming soon
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SEO Tab Content - Existing Functionality */}
            <TabsContent value="seo">
              <Summary summary={""} isLoading={false} />
            </TabsContent>

            {/* Placeholder Content for New Channels */}
            <TabsContent value="paid-social">
              <Card>
                <CardHeader>
                  <CardTitle>Paid Social Analytics</CardTitle>
                  <CardDescription>Coming soon - Connect your social ad accounts to see performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Paid social analytics integration coming soon
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="organic-social">
              <Card>
                <CardHeader>
                  <CardTitle>Organic Social Performance</CardTitle>
                  <CardDescription>Coming soon - Connect your social media accounts to track organic performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Organic social analytics integration coming soon
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ppc">
              <Card>
                <CardHeader>
                  <CardTitle>PPC Campaign Analytics</CardTitle>
                  <CardDescription>Coming soon - Connect your ad accounts to track PPC performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    PPC analytics integration coming soon
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Index;