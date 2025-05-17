'use client'

import { useParams } from 'next/navigation'
import { useContractRead, usePublicClient } from 'wagmi'
import { deploymentManagerAddress, auditRegistryAddress } from '../../../constants'
import ProjectModuleCard from '../../../components/ProjectModuleCard'
import { formatAddress } from '@/lib/utils'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ProjectModuleSkeleton from '../../../components/ProjectModuleSkeleton'

const { DeploymentManagerAbi } = require("../abi/DeploymentManager.json");
const { AuditRegistryAbi } = require("../abi/AuditRegistry.json");

type EnrichedModule = {
  address: string
  metadata: string
  audited: boolean
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = id as string
  const publicClient = usePublicClient()

  const { data: rawModules, isLoading } = useContractRead({
    address: deploymentManagerAddress,
    abi: DeploymentManagerAbi,
    functionName: 'getProjectModules',
    args: [projectId],
    watch: true,
  })

  const [modules, setModules] = useState<EnrichedModule[]>([])

  useEffect(() => {
    if (!rawModules) return

    const loadDetails = async () => {
      const enriched = await Promise.all(
        rawModules.map(async (mod: any) => {
          const address = mod.deployedAddress as string
          const metadata = mod.metadata

          let audited = false
          try {
            const templateId = await publicClient.readContract({
              address: deploymentManagerAddress,
              abi: DeploymentManagerAbi,
              functionName: 'getTemplateIdForModule',
              args: [address],
            })

            audited = await publicClient.readContract({
              address: auditRegistryAddress,
              abi: AuditRegistryAbi,
              functionName: 'isAudited',
              args: [templateId],
            })
          } catch (err) {
            console.warn(`Failed to get audit status for ${address}`, err)
          }

          return { address, metadata, audited }
        })
      )

      setModules(enriched)
    }

    loadDetails()
  }, [rawModules])

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Project: {formatAddress(projectId)}</h1>
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {isLoading || modules.length === 0 ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {Array(4)
      .fill(null)
      .map((_, i) => (
        <ProjectModuleSkeleton key={i} />
      ))}
  </div>
) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod, i) => (
            <ProjectModuleCard
              key={i}
              address={mod.address}
              metadata={mod.metadata}
              audited={mod.audited}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No modules deployed for this project yet.</p>
      )}
    </main>
  )
}
