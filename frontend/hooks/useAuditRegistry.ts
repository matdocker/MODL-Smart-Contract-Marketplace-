import {
  useAccount,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import { AUDIT_REGISTRY_ADDRESS, AUDIT_REGISTRY_ABI } from '@/constants/contracts';

async function uploadToIPFS(file: File): Promise<string> {
  try {
    if (typeof window === 'undefined') {
      throw new Error('IPFS upload can only run in the browser.');
    }

    const { create } = await import('ipfs-http-client');
    const client = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

    const added = await client.add(file);
    console.log(`✅ File uploaded to IPFS → CID: ${added.cid}`);
    return added.cid.toString();
  } catch (err) {
    console.error('❌ IPFS upload failed:', err);
    throw err;
  }
}

export function useAuditRegistry() {
  const { address } = useAccount();

  const {
    writeContractAsync: submitTemplateWrite,
    isPending: submittingTemplate,
  } = useWriteContract();

  const {
    writeContractAsync: submitAuditWrite,
    isPending: submittingAudit,
  } = useWriteContract();

  const {
    writeContractAsync: verifyAuditWrite,
    isPending: verifyingAudit,
  } = useWriteContract();

  const {
    data: rawAuditStats,
    isPending: auditStatsLoading,
    refetch: refetchAuditStats,
  } = useReadContract({
    address: AUDIT_REGISTRY_ADDRESS,
    abi: AUDIT_REGISTRY_ABI,
    functionName: 'getAuditStats',
    args: [address],
    query: {
      enabled: !!address,
      watch: true,
    },
  });

  const auditStats = rawAuditStats
    ? {
        total: Number(rawAuditStats[0]),
        pending: Number(rawAuditStats[1]),
        verified: Number(rawAuditStats[2]),
        disputed: Number(rawAuditStats[3]),
      }
    : { total: 0, pending: 0, verified: 0, disputed: 0 };

  const {
    data: templateIds,
    isPending: templateIdsLoading,
    refetch: refetchTemplateIds,
  } = useReadContract({
    address: AUDIT_REGISTRY_ADDRESS,
    abi: AUDIT_REGISTRY_ABI,
    functionName: 'getTemplateIds',
    query: {
      watch: true,
    },
  });

  const submitTemplate = async (
    name: string,
    category: string,
    solidityFile: File
  ) => {
    try {
      const cid = await uploadToIPFS(solidityFile);
      const tx = await submitTemplateWrite({
        address: AUDIT_REGISTRY_ADDRESS,
        abi: AUDIT_REGISTRY_ABI,
        functionName: 'submitTemplate',
        args: [name, category, `ipfs://${cid}`],
      });
      console.log(`✅ Template submitted → tx: ${tx.hash}`);
      await refetchTemplateIds();
      return tx;
    } catch (err) {
      console.error('❌ Error submitting template:', err);
      throw new Error('Template submission failed.');
    }
  };

  const submitAudit = async (
    templateId: string,
    templateAddress: string,
    reportURI: string,
    auditorTier: number
  ) => {
    try {
      const tx = await submitAuditWrite({
        address: AUDIT_REGISTRY_ADDRESS,
        abi: AUDIT_REGISTRY_ABI,
        functionName: 'submitAudit',
        args: [templateId, templateAddress, reportURI, auditorTier],
      });
      console.log(`✅ Audit submitted → tx: ${tx.hash}`);
      await refetchAuditStats();
      return tx;
    } catch (err) {
      console.error('❌ Error submitting audit:', err);
      throw new Error('Audit submission failed.');
    }
  };

  const verifyAudit = async (
    templateId: string,
    auditIndex: number,
    approve: boolean
  ) => {
    try {
      const tx = await verifyAuditWrite({
        address: AUDIT_REGISTRY_ADDRESS,
        abi: AUDIT_REGISTRY_ABI,
        functionName: 'verifyAudit',
        args: [templateId, auditIndex, approve],
      });
      console.log(`✅ Audit verified → tx: ${tx.hash}`);
      await refetchAuditStats();
      return tx;
    } catch (err) {
      console.error('❌ Error verifying audit:', err);
      throw new Error('Audit verification failed.');
    }
  };

  return {
    submitTemplate,
    submitAudit,
    verifyAudit,
    submittingTemplate,
    submittingAudit,
    verifyingAudit,
    auditStats,
    auditStatsLoading,
    refetchAuditStats,
    templateIds,
    templateIdsLoading,
    refetchTemplateIds,
  };
}
