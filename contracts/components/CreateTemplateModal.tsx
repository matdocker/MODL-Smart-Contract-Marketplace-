import { useState } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { uploadToIPFS } from '@/lib/ipfs';
import { Dialog } from '@headlessui/react';
import { useTemplateRegistry } from '@/hooks/useTemplateRegistry';
import { toast } from 'react-hot-toast';

export default function CreateTemplateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { submitTemplate, isSubmitting } = useTemplateRegistry();
  const { refetch } = useTemplates();

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a Solidity file');
      return;
    }

    if (!file.name.endsWith('.sol')) {
      setError('Only .sol files are allowed.');
      return;
    }

    setLoading(true);
    setError(null);

    let ipfsHash;
    try {
      ipfsHash = await uploadToIPFS(file);
    } catch (uploadErr) {
      console.error(uploadErr);
      setError('❌ File upload failed. Please try again.');
      setLoading(false);
      return;
    }

    try {
      await submitTemplate(name, category, ipfsHash);
      await refetch(); // ✅ refresh templates after submission
      toast.success('✅ Template submitted!');
      setIsOpen(false);
      setName('');
      setCategory('Uncategorized');
      setFile(null);
    } catch (err) {
      console.error(err);
      setError('❌ Submission failed. Please try again.');
      toast.error('❌ Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
        aria-label="Open New Template Modal"
      >
        + New Template
      </button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="bg-white rounded p-6 w-full max-w-md">
            <Dialog.Title className="text-lg font-bold mb-4">Submit New Template</Dialog.Title>

            <input
              type="text"
              placeholder="Template Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 mb-3"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border p-2 mb-3"
            >
              <option>Uncategorized</option>
              <option>DAO</option>
              <option>DeFi</option>
              <option>NFT</option>
              <option>Utility</option>
              <option>GameFi</option>
            </select>
            <input
              type="file"
              accept=".sol"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full mb-3"
            />

            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || isSubmitting}
              className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
              aria-label="Submit Template"
            >
              {loading || isSubmitting ? 'Submitting...' : 'Submit Template'}
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
