// types/modals.ts

export type ModalType = 'confirm' | null;

export type ConfirmModalPayload = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void>;
};

export type ModalState =
  | { type: null; props: {} }
  | { type: 'confirm'; props: ConfirmModalPayload };
