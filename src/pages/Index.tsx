
import { GoogleConnect } from "@/components/GoogleConnect";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const handleConnectionChange = (connected: boolean) => {
    // This callback can be used for future logic if needed
  };

  const handleAnalysisComplete = () => {
    // Navigate to dashboard after analysis is complete
    navigate("/dashboard");
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

        <GoogleConnect 
          onConnectionChange={handleConnectionChange}
          onAnalysisComplete={handleAnalysisComplete}
        />
      </div>
    </div>
  );
};

export default Index;
