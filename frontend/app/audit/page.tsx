'use client';

import { useAuditRegistry } from '@/hooks/useAuditRegistry';
import { useAccount } from 'wagmi';
import { useState } from 'react';

export default function AuditPage() {
  const { address, isConnected } = useAccount();
  const {
    getAudits,
    refetchAudits,
    submitAudit,
    loadingAudits,
    submittingAudit,
  } = useAuditRegistry();

  const [templateId, setTemplateId] = useState('');
  const [templateAddress, setTemplateAddress] = useState('');
  const [reportURI, setReportURI] = useState('');
  const [auditorTier, setAuditorTier] = useState(1);
  const [fetchedAudits, setFetchedAudits] = useState<any[]>([]);

  const handleSubmitAudit = async () => {
    try {
      await submitAudit(templateId, templateAddress, reportURI, auditorTier);
      alert('✅ Audit submitted!');
      await handleFetchAudits();
    } catch (err) {
      console.error(err);
      alert('❌ Failed to submit audit.');
    }
  };

  const handleFetchAudits = async () => {
    try {
      const result = await getAudits(templateId);
      setFetchedAudits(result);
    } catch (err) {
      console.error(err);
      alert('❌ Failed to fetch audits.');
    }
  };

  if (!isConnected) {
    return <div className="p-6 text-center">Please connect your wallet to access the audit panel.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🛠 Audit Queue</h1>

      <div className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Template ID"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Template Address"
          value={templateAddress}
          onChange={(e) => setTemplateAddress(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Report URI (IPFS/Arweave)"
          value={reportURI}
          onChange={(e) => setReportURI(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Auditor Tier"
          value={auditorTier}
          onChange={(e) => setAuditorTier(Number(e.target.value))}
          className="w-full p-2 border rounded"
        />
        <div className="flex space-x-2">
          <button
            onClick={handleSubmitAudit}
            disabled={submittingAudit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {submittingAudit ? 'Submitting...' : 'Submit Audit'}
          </button>
          <button
            onClick={handleFetchAudits}
            disabled={loadingAudits}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {loadingAudits ? 'Fetching...' : 'Fetch Audits'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Fetched Audits</h2>
        {loadingAudits ? (
          <p>Loading audits...</p>
        ) : fetchedAudits.length === 0 ? (
          <p>No audits found.</p>
        ) : (
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(fetchedAudits, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
