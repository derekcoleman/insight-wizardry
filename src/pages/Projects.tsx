import { ProjectList } from "@/components/ProjectList";

const Projects = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ProjectList />
        </div>
      </div>
    </div>
  );
};

export default Projects;