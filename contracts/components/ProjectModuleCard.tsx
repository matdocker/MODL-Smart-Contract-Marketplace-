'use client';

import { FC } from 'react';
import { Copy, ShieldCheck, ShieldX } from 'lucide-react'; // icons for status + actions
import { formatAddress } from '@/lib/utils'; // helper to shorten/format addresses
import toast from 'react-hot-toast'; // for copy-to-clipboard success message

type ProjectModuleCardProps = {
  address: string;
  metadata: string;
  audited: boolean;
  auditLoading: boolean;
};

const ProjectModuleCard: FC<ProjectModuleCardProps> = ({
  address,
  metadata,
  audited,
  auditLoading,
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied!');
    } catch (err) {
      toast.error('Failed to copy.');
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 break-all">
          {formatAddress(address)}
        </h3>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-blue-500 transition"
          title="Copy address"
        >
          <Copy size={16} />
        </button>
      </div>

      <p className="text-xs text-gray-500 break-words mb-2">
        {metadata || 'No metadata available'}
      </p>

      <div className="flex items-center space-x-2">
        {auditLoading ? (
          <span className="text-xs text-yellow-500">Checking audit status...</span>
        ) : audited ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
            <ShieldCheck size={12} className="mr-1" /> Audited
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
            <ShieldX size={12} className="mr-1" /> Not Audited
          </span>
        )}
      </div>
    </div>
  );
};

export default ProjectModuleCard;
