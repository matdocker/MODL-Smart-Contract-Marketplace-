'use client';

import Link from 'next/link';
import { Trash2, PlusCircle } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useGlobalModal } from '@/context/ModalContext';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAccount } from 'wagmi';

export default function ProjectCard({
  project,
  onDelete,
  onCreate,
  gaslessEnabled,
  tier,
}: {
  project: Project;
  onDelete?: (p: Project) => void;
  onCreate?: (p: Project) => void;
  gaslessEnabled: boolean;
  tier: number;
}) {
  const { deleteProject, createProject } = useProjects(gaslessEnabled, tier);
  const { openConfirmModal } = useGlobalModal();
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!address) return toast.error('Wallet not connected');
    setLoading(true);

    try {
      toast.loading('🗑️ Deleting project...', { id: 'delete' });

      await deleteProject(project.projectId);

      toast.success('✅ Project deleted', { id: 'delete' });
      if (onDelete) onDelete(project);
    } catch (err: any) {
      console.error('❌ Error deleting project:', err);
      toast.error(err?.message || 'Failed to delete project', { id: 'delete' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!address) return toast.error('Wallet not connected');
    setLoading(true);

    try {
      const newProjectName = `${project.name}-copy`;

      toast.loading('✨ Cloning project...', { id: 'clone' });

      await createProject(newProjectName);

      toast.success(`✅ Project "${newProjectName}" created`, { id: 'clone' });
      if (onCreate) onCreate(project);
    } catch (err: any) {
      console.error('❌ Clone failed:', err);
      toast.error(err?.message || 'Failed to create project', { id: 'clone' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative group rounded-2xl p-5 sm:p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition transform hover:-translate-y-1 hover:shadow-md ${
        loading ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Clone Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleCreate();
        }}
        title="Clone project"
        className="absolute top-2 right-2 p-1 rounded hover:bg-green-100 dark:hover:bg-green-900 transition"
      >
        <PlusCircle className="h-4 w-4 text-green-500" />
      </button>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          openConfirmModal({
            title: `Delete "${project.name}"?`,
            description: 'This action is irreversible.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: handleDelete,
          });
        }}
        title="Delete project"
        className="absolute bottom-2 right-2 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </button>

      {/* Project Content */}
      <Link href={`/project/${project.projectId}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            {project.name}
          </h3>
        </div>
        <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <p>
            <span className="font-medium text-blue-700 dark:text-blue-400">Project ID:</span>{' '}
            {project.projectId.toString()}
          </p>
          <p>
            <span className="font-medium text-blue-700 dark:text-blue-400">Modules:</span>{' '}
            {project.moduleCount.toString()}
          </p>
        </div>
      </Link>
    </div>
  );
}
