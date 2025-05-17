// lib/fetchTemplates.ts
import { TEMPLATE_REGISTRY_ADDRESS, TEMPLATE_REGISTRY_ABI, AUDIT_REGISTRY_ADDRESS, AUDIT_REGISTRY_ABI } from '@/constants/contracts';
import { getPublicClient } from 'wagmi/actions'; // or usePublicClient() inside React if needed
import type { Template } from '@/types/template';

export async function fetchTemplates(): Promise<Template[]> {
  const publicClient = getPublicClient(); // for use outside React components

  const categoryMap = {
    0: 'Uncategorized',
    1: 'DAO',
    2: 'DeFi',
    3: 'NFT',
    4: 'Utility',
    5: 'GameFi',
  };

  const count = await publicClient.readContract({
    address: TEMPLATE_REGISTRY_ADDRESS,
    abi: TEMPLATE_REGISTRY_ABI,
    functionName: 'getTemplateCount',
  });

  const ids = await Promise.all(
    Array.from({ length: Number(count) }).map((_, i) =>
      publicClient.readContract({
        address: TEMPLATE_REGISTRY_ADDRESS,
        abi: TEMPLATE_REGISTRY_ABI,
        functionName: 'getTemplateIdByIndex',
        args: [BigInt(i)],
      })
    )
  );

  const templates = await Promise.all(
    ids.map(async (templateId) => {
      const data = await publicClient.readContract({
        address: TEMPLATE_REGISTRY_ADDRESS,
        abi: TEMPLATE_REGISTRY_ABI,
        functionName: 'getTemplate',
        args: [templateId],
      });

      const audited = await publicClient.readContract({
        address: AUDIT_REGISTRY_ADDRESS,
        abi: AUDIT_REGISTRY_ABI,
        functionName: 'isAudited',
        args: [templateId],
      });

      return {
        templateId,
        implementation: data.implementation,
        name: data.name,
        version: data.version,
        author: data.author,
        verified: data.verified,
        templateType: data.templateType,
        auditHash: data.auditHash,
        audited,
        category: categoryMap[data.templateType] || 'Uncategorized',
        description: `Template ${data.name} by ${data.author.slice(0, 6)}...`,
      };
    })
  );

  return templates.reverse();
}
