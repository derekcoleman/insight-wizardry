import { GrowthChannelTabs } from "@/components/GrowthChannelTabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Growth Analytics</span>
              <span className="block text-blue-600">& Strategy Platform</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Analyze and optimize your digital marketing performance across all channels - from SEO to paid advertising.
            </p>
          </div>
          
          <div className="mt-10">
            <GrowthChannelTabs />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;