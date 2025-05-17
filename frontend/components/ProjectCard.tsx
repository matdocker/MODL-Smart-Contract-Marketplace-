// components/ProjectCard.tsx
'use client';

import Link from 'next/link';

type Project = {
  projectId: bigint;
  name: string;
  owner: string;
};

type Props = {
  project: Project;
};

export default function ProjectCard({ project }: Props) {
  const isPending = project.name.includes('(pending...)');
  const displayName = project.name.replace(' (pending...)', '');

  return (
    <Link
      href={`/project/${project.projectId.toString()}`}
      className="block border border-gray-700 rounded-lg p-4 hover:bg-gray-900 transition relative"
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-white">{displayName}</h3>
        {isPending && (
          <span className="flex items-center text-xs text-yellow-400 bg-yellow-800 bg-opacity-30 px-2 py-0.5 rounded ml-2">
            <svg
              className="animate-spin h-3 w-3 mr-1 text-yellow-400"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.372 0 0 5.372 0 12h4z"
              />
            </svg>
            Pending
          </span>
        )}
      </div>

      <p className="text-sm text-gray-400 mt-1">
        Project ID: {project.projectId.toString()}
      </p>
      <p className="text-sm text-gray-400">Owner: {project.owner}</p>
    </Link>
  );
}
