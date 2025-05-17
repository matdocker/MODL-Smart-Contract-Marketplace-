'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { formatAddress } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

type ProjectModuleCardProps = {
  address: string
  metadata?: string
}

export default function ProjectModuleCard({ address, metadata }: ProjectModuleCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    toast.success('Address copied!')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-2xl border border-gray-300 shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-mono text-sm text-gray-800">{formatAddress(address)}</p>
          <a
            href={`https://sepolia.basescan.org/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1 mt-1"
          >
            View on BaseScan <ExternalLink size={12} />
          </a>
        </div>

        <button
          onClick={handleCopy}
          className="text-xs bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {metadata && (
        <p className="text-sm text-gray-600 truncate">
          <span className="font-medium">Metadata:</span> {metadata}
        </p>
      )}
    </div>
  )
}
//
// 🔜 Future Enhancements (Optional)
// Add audit badge via AuditRegistry

// Expand to show ABI functions or module type

// Make it collapsible/expandable

