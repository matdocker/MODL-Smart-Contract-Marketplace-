'use client';

import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';

export default function CreateProjectModal() {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { createProject, fetchProjects } = useProjects();

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      await createProject(name.trim());
      await fetchProjects(); // ✅ refresh the list after creation
      setOpen(false);
      setName('');
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        + Create Project
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>

            <input
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded mb-4"
            />

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setOpen(false)}
                className="text-gray-600 hover:text-gray-900"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
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
