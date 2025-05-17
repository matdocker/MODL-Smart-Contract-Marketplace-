import { useTemplates } from '@/hooks/useTemplates';
import CreateTemplateModal from '@/components/CreateTemplateModal';

export default function TemplateList() {
  const { templates, loading, error } = useTemplates();

  if (loading) return <p>Loading templates...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Templates</h1>
        <CreateTemplateModal />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl) => (
          <div key={tpl.templateId} className="p-4 border rounded shadow-sm">
            <h3 className="text-lg font-semibold">{tpl.name} (v{tpl.version})</h3>
            <p className="text-sm">Category: {tpl.category}</p>
            <p className="text-sm">Author: {tpl.author.slice(0, 6)}...</p>
            <p className="text-sm">{tpl.audited ? '✅ Audited' : '⚠ Not Audited'}</p>
            <a
              href={`https://sepolia.basescan.org/address/${tpl.implementation}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm hover:underline"
            >
              View Contract
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
