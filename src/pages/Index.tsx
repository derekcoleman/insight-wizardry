
import { GoogleConnect } from "@/components/GoogleConnect";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { AnalysisResults } from "@/components/AnalysisResults";
import { useState } from "react";

const Index = () => {
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  const handleSelectAnalysis = (analysisData: any) => {
    setSelectedAnalysis(analysisData);
    setSelectedStrategy(null);
  };

  const handleSelectStrategy = (strategyData: any) => {
    setSelectedStrategy(strategyData);
    setSelectedAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SEO Analytics Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect your Google Analytics and Search Console to get comprehensive SEO insights and automated strategies.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ProjectSidebar 
              onSelectAnalysis={handleSelectAnalysis}
              onSelectStrategy={handleSelectStrategy}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedAnalysis ? (
              <AnalysisResults report={selectedAnalysis} isLoading={false} />
            ) : selectedStrategy ? (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">SEO Strategy</h2>
                {/* TODO: Add strategy display component */}
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(selectedStrategy, null, 2)}
                </pre>
              </div>
            ) : (
              <GoogleConnect />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;
