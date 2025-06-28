
import { useState } from "react";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { AnalysisResults } from "@/components/AnalysisResults";

const Dashboard = () => {
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
            Your comprehensive SEO insights and automated strategies.
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
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(selectedStrategy, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Welcome to Your Dashboard
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Select a project from the sidebar to view your analysis results and SEO strategies.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
