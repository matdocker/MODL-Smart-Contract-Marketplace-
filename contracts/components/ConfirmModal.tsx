'use client';
import Modal from './Modal';
import { useGlobalModal } from '@/context/ModalContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ConfirmModal() {
  const { modal, closeModal } = useGlobalModal();
  const [loading, setLoading] = useState(false);

  if (modal.type !== 'confirm') return null;

  const { title, description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm } = modal.props;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      toast.success('Action successful');
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={modal.type === 'confirm'} onClose={closeModal}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
      {description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>}

      <div className="flex justify-end space-x-3">
        <button
          onClick={closeModal}
          className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          disabled={loading}
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
