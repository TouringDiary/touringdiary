import React, { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import type { ModalPropsBag } from '../types/modalProps';

export type { ModalPropsBag } from '../types/modalProps';

interface ModalContextType {
  activeModal: string | null;
  modalProps: ModalPropsBag;
  openModal: (type: string, props?: ModalPropsBag) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children?: ReactNode }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalProps, setModalProps] = useState<ModalPropsBag>({});

  const openModal = useCallback((type: string, props: ModalPropsBag = {}) => {
    setModalProps(props);
    setActiveModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalProps({});
  }, []);

  const value = React.useMemo(
    () => ({
      activeModal,
      modalProps,
      openModal,
      closeModal,
    }),
    [activeModal, modalProps, openModal, closeModal],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
