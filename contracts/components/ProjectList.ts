'use client';

import { useProjects } from '@/hooks/useProjects';
import ProjectModuleSkeleton from '@/components/ProjectModuleSkeleton';

export default function ProjectList() {
  const { projects, loading } = useProjects();

  if (loading) {
    // Show 3 skeleton loaders
    return (
      <div className="space-y-4">
        <ProjectModuleSkeleton />
        <ProjectModuleSkeleton />
        <ProjectModuleSkeleton />
      </div>
    );
  }

  if (projects.length === 0) {
    return <div>No projects found.</div>;
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div
          key={project.projectId.toString()}
          className="border p-4 rounded shadow"
        >
          <h3 className="text-lg font-semibold">{project.name}</h3>
          <p className="text-sm text-gray-600">Owner: {project.owner}</p>
          <p className="text-sm text-gray-600">
            Modules: {project.moduleAddresses.length}
          </p>
        </div>
      ))}
    </div>
  );
}
