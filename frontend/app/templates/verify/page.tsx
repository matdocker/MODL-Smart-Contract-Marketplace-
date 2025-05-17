'use client';

import { useAuditRegistry } from '@/hooks/useAuditRegistry';
import { useAccount } from 'wagmi';
import { useState } from 'react';

export default function VerifyPage() {
  const { address, isConnected } = useAccount();
  const {
    audits,
    refetchAudits,
    verifyAudit,
    loadingAudits,
    verifyingAudit,
  } = useAuditRegistry();

  const [templateId, setTemplateId] = useState('');
  const [auditIndex, setAuditIndex] = useState(0);
  const [approve, setApprove] = useState(true);

  const handleVerify = async () => {
    try {
      await verifyAudit(templateId, auditIndex, approve);
      alert('✅ Audit verification submitted!');
      await refetchAudits();
    } catch (err) {
      console.error(err);
      alert('❌ Failed to verify audit.');
    }
  };

  if (!isConnected) {
    return <div className="p-6 text-center">Please connect your wallet to access the verification panel.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">✅ Verification Panel</h1>

      <div className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Template ID"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Audit Index"
          value={auditIndex}
          onChange={(e) => setAuditIndex(Number(e.target.value))}
          className="w-full p-2 border rounded"
        />
        <select
          value={approve ? 'approve' : 'reject'}
          onChange={(e) => setApprove(e.target.value === 'approve')}
          className="w-full p-2 border rounded"
        >
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
        </select>

        <button
          onClick={handleVerify}
          disabled={verifyingAudit}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {verifyingAudit ? 'Verifying...' : 'Submit Verification'}
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Current Audits</h2>
        {loadingAudits ? (
          <p>Loading audits...</p>
        ) : (
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(audits, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
