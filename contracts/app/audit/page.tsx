'use client'

import { useAuditRegistry } from '@/hooks/useAuditRegistry'
import { useTemplateAudits } from '@/hooks/useTemplateAudits'
import { useAccount } from 'wagmi'
import { useState } from 'react'
import { uploadFileToIPFS } from '@/lib/uploadToIPFS'
import 'tailwindcss'

function AuditSkeleton() {
  return (
    <div className="border p-3 rounded bg-gray-100 animate-pulse space-y-2 shadow-sm">
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
      <div className="h-3 w-1/3 bg-gray-200 rounded" />
      <div className="h-3 w-2/3 bg-gray-200 rounded" />
      <div className="h-3 w-1/4 bg-gray-200 rounded" />
    </div>
  )
}

export default function AuditPage() {
  const { isConnected } = useAccount()
  const { submitAudit, submittingAudit, refetchAuditStats } = useAuditRegistry()

  const [templateId, setTemplateId] = useState('')
  const [templateAddress, setTemplateAddress] = useState('')
  const [auditorTier, setAuditorTier] = useState<number | ''>(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    audits,
    isLoading: loadingAudits,
    hasAudits,
    refetch: refetchTemplateAudits,
  } = useTemplateAudits(templateId)

  const handleSubmitAudit = async () => {
    if (!templateId || !templateAddress || !selectedFile || auditorTier === '') {
      alert('⚠ Please fill in all fields and select a file before submitting.')
      return
    }
    try {
      const reportURI = await uploadFileToIPFS(selectedFile)
      await submitAudit(templateId, templateAddress, reportURI, Number(auditorTier))
      await Promise.all([refetchTemplateAudits(), refetchAuditStats()])
      alert('✅ Audit submitted, file uploaded, and data refreshed!')
    } catch (err) {
      console.error(err)
      alert('❌ Failed to submit audit or upload file.')
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-[#cbd5e1]">
        Please connect your wallet to access the audit panel.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-10 px-4 text-[#f1f5f9]">
      <div className="max-w-3xl mx-auto bg-[#1e293b] border border-[#64748b] shadow-lg rounded-xl p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">🛠 Audit Queue</h1>

        <div className="space-y-4 mb-10">
          <input
            type="text"
            placeholder="Template ID"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full p-3 rounded bg-[#0f172a] border border-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-[#f1f5f9] placeholder-[#cbd5e1]"
          />
          <input
            type="text"
            placeholder="Template Address"
            value={templateAddress}
            onChange={(e) => setTemplateAddress(e.target.value)}
            className="w-full p-3 rounded bg-[#0f172a] border border-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-[#f1f5f9] placeholder-[#cbd5e1]"
          />
          <input
            type="file"
            accept=".pdf,.txt,.md,.json"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full p-3 rounded bg-[#0f172a] border border-[#64748b] text-[#f1f5f9]"
          />
          <input
            type="number"
            placeholder="Auditor Tier"
            value={auditorTier}
            onChange={(e) =>
              setAuditorTier(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="w-full p-3 rounded bg-[#0f172a] border border-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] text-[#f1f5f9] placeholder-[#cbd5e1]"
          />
          <button
            onClick={handleSubmitAudit}
            disabled={submittingAudit}
            className="w-full px-4 py-2 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] disabled:opacity-50 transition"
          >
            {submittingAudit ? 'Submitting...' : 'Submit Audit'}
          </button>
        </div>

        <h2 className="text-2xl font-semibold mb-4 text-center">Fetched Audits</h2>

        {loadingAudits ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <AuditSkeleton key={i} />
            ))}
          </div>
        ) : !hasAudits ? (
          <p className="text-center text-[#cbd5e1]">No audits found for this template.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {audits.map((audit, index) => (
              <div
                key={index}
                className="border border-[#64748b] p-4 rounded bg-[#1e293b] text-sm space-y-1 shadow-sm hover:shadow-md transition"
              >
                <p>
                  <span className="font-semibold">Auditor:</span> {audit.auditor}
                </p>
                <p>
                  <span className="font-semibold">Status:</span> {audit.statusLabel}
                </p>
                <p>
                  <span className="font-semibold">Report:</span>{' '}
                  <a
                    href={audit.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3b82f6] underline hover:text-[#2563eb] break-all"
                  >
                    View Report
                  </a>
                </p>
                <p>
                  <span className="font-semibold">Submitted:</span> {audit.createdAtFormatted}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
