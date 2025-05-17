'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ModalType, ModalState, ConfirmModalPayload } from '@/types/modals';

type ModalContextType = {
  modal: ModalState;
  openConfirmModal: (props: ConfirmModalPayload) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modal, setModal] = useState<ModalState>({ type: null, props: {} });

  const openConfirmModal = (props: ConfirmModalPayload) => {
    setModal({ type: 'confirm', props });
  };

  const closeModal = () => {
    setModal({ type: null, props: {} });
  };

  return (
    <ModalContext.Provider value={{ modal, openConfirmModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useGlobalModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useGlobalModal must be used within ModalProvider');
  return context;
};
