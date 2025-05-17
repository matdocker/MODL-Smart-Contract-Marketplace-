'use client';

import { useGasless } from '@/hooks/useGasless';
import { useProjects } from '@/hooks/useProjects';
import CreateProjectModal from '@/components/CreateProjectModal';
import ProjectSlider from '@/components/ProjectSlider';
import SkeletonBox from '@/components/SkeletonBox';
import { useAccount } from 'wagmi';

export default function DashboardProjects() {
  const { address, isConnected } = useAccount();
  const { projects, loading, refetchProjects, createProject, deleteProject } = useProjects();

  if (!isConnected) {
    return <p className="text-center">Please connect your wallet to view your projects.</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        <CreateProjectModal
          onCreate={async (name) => {
            try {
              await createProject(name);
              await refetchProjects();
            } catch (error) {
              console.error('❌ Failed to create project:', error);
            }
          }}
        />
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SkeletonBox key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No projects yet. Create your first project!</p>
      ) : (
        <ProjectSlider
          projects={projects}
          onDelete={async (project) => {
            try {
              await deleteProject(project.projectId);
              await refetchProjects();
            } catch (error) {
              console.error('❌ Failed to delete project:', error);
            }
          }}
          onCreate={async (project) => {
            try {
              const newName = `${project.name}-copy`;
              await createProject(newName);
              await refetchProjects();
            } catch (error) {
              console.error('❌ Failed to clone project:', error);
            }
          }}
        />
      )}
    </section>
  );
}
