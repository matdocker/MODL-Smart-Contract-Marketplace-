import { usePublicClient } from 'wagmi'
import { useEffect, useState } from 'react'
import { auditRegistryAddress } from '@/constants'
import AuditRegistryAbi from '@/abi/AuditRegistry.json'

export function useAuditStatus(templateId: string | undefined) {
  const publicClient = usePublicClient()
  const [isAudited, setIsAudited] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!templateId) {
      setIsAudited(null)
      return
    }

    const fetchAuditStatus = async () => {
      setLoading(true)
      try {
        const result = await publicClient.readContract({
          address: auditRegistryAddress,
          abi: AuditRegistryAbi,
          functionName: 'isAudited',
          args: [templateId],
        })
        setIsAudited(result)
      } catch (err) {
        console.error('Failed to fetch audit status', err)
        setError('Failed to fetch audit status')
        setIsAudited(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAuditStatus()
  }, [templateId, publicClient])

  return { isAudited, loading, error }
}
