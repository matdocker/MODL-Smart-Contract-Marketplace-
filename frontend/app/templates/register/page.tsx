'use client';

import { useAuditRegistry } from '@/hooks/useAuditRegistry';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import ProjectModuleSkeleton from '@/components/ProjectModuleSkeleton'; // adjust path if needed

export default function RegisterTemplatePage() {
  const { isConnected } = useAccount();
  const { submitTemplate, submittingTemplate } = useAuditRegistry();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [solidityFile, setSolidityFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !solidityFile) {
      alert('Please fill out all fields and upload a Solidity file.');
      return;
    }

    if (!solidityFile.name.endsWith('.sol')) {
      alert('Please upload a valid Solidity (.sol) file.');
      return;
    }

    try {
      await submitTemplate(name, category, solidityFile);
      alert('✅ Template submitted successfully!');
      setName('');
      setCategory('');
      setSolidityFile(null);
    } catch (err: any) {
      console.error(err);
      alert(`❌ Error submitting template: ${err.message || 'Unknown error'}`);
    }
  };

  if (!isConnected) {
    return <div className="text-center mt-10 text-gray-500">Please connect your wallet to submit a template.</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Submit New Template</h1>

      {submittingTemplate && (
        <div className="mb-4">
          <ProjectModuleSkeleton />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Template Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Example: MyContract"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Example: ERC20, NFT, DAO"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Upload Solidity File</label>
          <input
            type="file"
            accept=".sol"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSolidityFile(e.target.files[0]);
              }
            }}
            className="w-full"
            required
          />
          {solidityFile && <p className="text-sm text-gray-500 mt-1">Selected: {solidityFile.name}</p>}
        </div>
        <button
          type="submit"
          disabled={submittingTemplate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submittingTemplate ? 'Submitting...' : 'Submit Template'}
        </button>
      </form>
    </div>
  );
}
