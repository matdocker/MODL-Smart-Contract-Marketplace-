import { useReadContract } from 'wagmi';
import { AUDIT_REGISTRY_ADDRESS, AUDIT_REGISTRY_ABI } from '@/constants/contracts';

export interface Audit {
  templateId: string;
  auditor: string;
  reportURI: string;
  reportUrl: string;
  status: number;
  statusLabel: string;
  createdAtRaw: number | null;
  createdAtFormatted: string;
}

export function useTemplateAudits(templateId: string) {
  const {
    data: rawAudits,
    isPending,
    refetch,
    error,
  } = useReadContract({
    address: AUDIT_REGISTRY_ADDRESS,
    abi: AUDIT_REGISTRY_ABI,
    functionName: 'getAudits',
    args: [templateId],
    query: {
      enabled: !!templateId,
      watch: true,
    },
  });

  const statusMap: { [key: number]: string } = {
    0: 'Pending',
    1: 'Approved',
    2: 'Rejected',
    3: 'Disputed',
  };

  const audits: Audit[] = Array.isArray(rawAudits)
    ? rawAudits.map((audit: any) => {
        const templateId = audit.templateId || audit[0];
        const auditor = audit.auditor || audit[1];
        const reportURI = audit.reportURI || audit[2];
        const status = Number(audit.status || audit[3]);
        const createdAt = audit.createdAt ? Number(audit.createdAt) : null;

        const reportUrl = reportURI.startsWith('ipfs://')
          ? `https://ipfs.io/ipfs/${reportURI.replace('ipfs://', '')}`
          : reportURI;

        return {
          templateId,
          auditor,
          reportURI,
          reportUrl,
          status,
          statusLabel: statusMap[status] || 'Unknown',
          createdAtRaw: createdAt,
          createdAtFormatted: createdAt
            ? new Date(createdAt * 1000).toLocaleString()
            : 'N/A',
        };
      })
    : [];

  const hasAudits = audits.length > 0;

  return {
    audits,
    hasAudits,
    isLoading: isPending,
    refetch,
    error,
  };
}
