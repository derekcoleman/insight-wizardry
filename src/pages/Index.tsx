import { Summary } from "@/components/Summary";
import { GoogleConnect } from "@/components/GoogleConnect";
import { useState } from "react";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <img
                src="/logo.webp"
                alt="Standup Notez Logo"
                className="h-8 w-auto"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Analyze Your</span>
              <span className="block text-blue-600">Google Analytics Data</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Get instant, AI-powered insights from your Google Analytics and Search Console data. Perfect for presenting in meetings and making data-driven decisions.
            </p>
            <div className="mt-10 max-w-lg mx-auto">
              <GoogleConnect onConnectionChange={handleConnectionChange} />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Only show when not connected */}
      {!isConnected && (
        <div className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">Automated Analysis</h3>
                <p className="mt-2 text-gray-600">Get comprehensive analysis of your Google Analytics 4 data with just a few clicks.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">Search Performance</h3>
                <p className="mt-2 text-gray-600">Track and analyze your Search Console metrics to improve visibility.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">Meeting-Ready Reports</h3>
                <p className="mt-2 text-gray-600">Generate professional reports perfect for presentations and meetings.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isConnected ? '' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <Summary summary={""} isLoading={false} />
      </div>
    </div>
  );
};

export default Index;