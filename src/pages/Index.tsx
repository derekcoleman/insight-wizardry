
import { Summary } from "@/components/Summary";
import { GoogleConnect } from "@/components/GoogleConnect";
import { AuthButton } from "@/components/auth/AuthButton";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show sign in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Simplify Your</span>
                <span className="block text-blue-600">SEO Analytics</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Instantly turn Google Analytics and Search Console data into AI-driven insights for client meetings and smarter decisions.
              </p>
              <div className="mt-10">
                <Button 
                  onClick={() => navigate('/auth')}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sign In to Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
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
                <h3 className="text-lg font-medium text-gray-900">Save & Manage Audits</h3>
                <p className="mt-2 text-gray-600">Save your analysis results and manage audit history with secure user accounts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Auth Button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">SEO Analytics Dashboard</h1>
          <AuthButton />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">
              <span className="block">Welcome back!</span>
              <span className="block text-blue-600">Connect Your Analytics</span>
            </h2>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Connect your Google Analytics and Search Console to start generating insights.
            </p>
            <div className="mt-10">
              <GoogleConnect onConnectionChange={handleConnectionChange} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={isConnected ? 'w-3/4 mx-auto' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <Summary summary={""} isLoading={false} />
      </div>
    </div>
  );
};

export default Index;
