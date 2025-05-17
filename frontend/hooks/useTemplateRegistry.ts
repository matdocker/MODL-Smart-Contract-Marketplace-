import { useContractWrite } from 'wagmi';
import { TEMPLATE_REGISTRY_ADDRESS, TEMPLATE_REGISTRY_ABI } from '@/constants/contracts';

export function useTemplateRegistry() {
  const { writeAsync, isLoading } = useContractWrite({
    address: TEMPLATE_REGISTRY_ADDRESS,
    abi: TEMPLATE_REGISTRY_ABI,
    functionName: 'submitTemplate',
  });

  const submitTemplate = async (name: string, category: string, ipfsHash: string) => {
    try {
      const tx = await writeAsync({
        args: [name, category, ipfsHash],
      });
      console.log(`✅ Template submitted → tx hash: ${tx.hash}`);
      return tx;
    } catch (err) {
      console.error('❌ Error submitting template:', err);
      throw err;
    }
  };

  return {
    submitTemplate,
    isSubmitting: isLoading,
  };
}
