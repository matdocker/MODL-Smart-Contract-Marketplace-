'use client';

import { useAuditRegistry } from '@/hooks/useAuditRegistry';
import { useTemplateAudits } from '@/hooks/useTemplateAudits';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';

export default function VerifyPage() {
  const { isConnected } = useAccount();
  const { verifyAudit, verifyingAudit, refetchAuditStats } = useAuditRegistry();

  const [templateId, setTemplateId] = useState('');
  const [auditIndex, setAuditIndex] = useState(0);
  const [approve, setApprove] = useState(true);

  const {
    audits,
    isLoading: loadingAudits,
    refetch: refetchTemplateAudits,
  } = useTemplateAudits(templateId);

  const handleVerify = async () => {
    if (!templateId) {
      alert('⚠ Please enter a Template ID.');
      return;
    }
    await verifyAudit(templateId, auditIndex, approve);
    await Promise.all([refetchTemplateAudits(), refetchAuditStats()]);
    alert('✅ Audit verification submitted and data refreshed!');
  };

  // if user isn’t connected, show a connect button instead
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <p className="mb-4 text-gray-700">Please connect your wallet to access the verification panel.</p>
        <ConnectButton />
      </div>
    );
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
          className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
        />
        <input
          type="number"
          placeholder="Audit Index"
          value={auditIndex}
          onChange={(e) => setAuditIndex(Number(e.target.value))}
          className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
        />
        <select
          value={approve ? 'approve' : 'reject'}
          onChange={(e) => setApprove(e.target.value === 'approve')}
          className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
        >
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
        </select>
        <button
          onClick={handleVerify}
          disabled={verifyingAudit}
          className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {verifyingAudit ? 'Verifying...' : 'Submit Verification'}
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Current Audits for Template</h2>
        {loadingAudits ? (
          <p>Loading audits…</p>
        ) : audits.length === 0 ? (
          <p className="text-gray-500">No audits found for this template.</p>
        ) : (
          <div className="space-y-4">
            {audits.map((audit, idx) => (
              <div key={idx} className="border p-4 rounded bg-gray-50">
                <p><strong>Index:</strong> {idx}</p>
                <p><strong>Auditor:</strong> {audit.auditor}</p>
                <p><strong>Status:</strong> {audit.statusLabel}</p>
                <p>
                  <strong>Report:</strong>{' '}
                  <a href={audit.reportUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    View Report
                  </a>
                </p>
                <p><strong>Submitted:</strong> {audit.createdAtFormatted}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
