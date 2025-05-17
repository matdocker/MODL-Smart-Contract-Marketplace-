'use client';

import { useAuditRegistry } from '@/hooks/useAuditRegistry';

export default function VerifyPage() {
  const { audits, verifyAudit } = useAuditRegistry();

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Verification Queue</h1>
      {audits.length === 0 ? (
        <div className="text-gray-500">No audits to verify.</div>
      ) : (
        <table className="w-full table-auto border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Template ID</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((audit: any, index: number) => (
              <tr key={index}>
                <td className="border px-2 py-1">{audit.template}</td>
                <td className="border px-2 py-1">{audit.status}</td>
                <td className="border px-2 py-1 space-x-2">
                  <button
                    onClick={() => verifyAudit(audit.template, index, true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => verifyAudit(audit.template, index, false)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
