
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { OverviewModule } from "@/components/dashboard/modules/OverviewModule";
import { PerformanceModule } from "@/components/dashboard/modules/PerformanceModule";
import { SavedAuditsModule } from "@/components/dashboard/modules/SavedAuditsModule";
import { TechnicalSEOModule } from "@/components/dashboard/modules/TechnicalSEOModule";
import { ContentStrategyModule } from "@/components/dashboard/modules/ContentStrategyModule";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Complete SEO Audit Dashboard
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Comprehensive SEO analysis powered by AI. Connect your Google Analytics and Search Console for instant insights, automated audits, and actionable recommendations.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Technical SEO Audit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Performance Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>AI-Powered Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Competitive Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container py-8 space-y-6">
        <OverviewModule />
        
        <DashboardGrid>
          <PerformanceModule />
          <SavedAuditsModule />
        </DashboardGrid>
        
        <DashboardGrid>
          <TechnicalSEOModule />
          <ContentStrategyModule />
        </DashboardGrid>
      </div>
    </div>
  );
};

export default Index;
