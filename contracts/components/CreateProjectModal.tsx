'use client';

import { useState, useRef, useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import { toast } from 'react-hot-toast';

export default function CreateProjectModal({ onCreate }: { onCreate?: () => void }) {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { createProject } = useProjects();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('⚠️ Project name is required');
      return;
    }

    try {
      setLoading(true);
      toast.loading('🚀 Creating project...', { id: 'create' });

      await createProject(name.trim());

      toast.success('✅ Project created successfully', { id: 'create' });

      if (onCreate) onCreate();

      setOpen(false);
      setName('');
    } catch (err: any) {
      console.error('❌ Error creating project:', err);
      toast.error(`❌ Failed: ${err.message || 'Unknown error'}`, { id: 'create' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600 dark:hover:bg-blue-500 transition"
      >
        + Create Project
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-400/40 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Create New Project
            </h2>

            <input
              ref={inputRef}
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              disabled={loading}
            />

            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => {
                  setOpen(false);
                  setName('');
                }}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600 dark:hover:bg-blue-500 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
