import useSWR from 'swr';
import { fetchTemplates } from '@/lib/fetchTemplates';

export function useTemplates() {
  const {
    data: templates,
    error,
    isLoading,
    mutate: refetch,
  } = useSWR('templates', fetchTemplates, {
    refreshInterval: 10_000, // live updating
  });

  return {
    templates: templates || [],
    loading: isLoading,
    error,
    refetch,
  };
}
