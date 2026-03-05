
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ModalContextType {
    activeModal: string | null;
    modalProps: any;
    openModal: (type: string, props?: any) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children?: ReactNode }) => {
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [modalProps, setModalProps] = useState<any>({});

    const openModal = useCallback((type: string, props: any = {}) => {
        setModalProps(props);
        setActiveModal(type);
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
        setModalProps({});
    }, []);

    return (
        <ModalContext.Provider value={{ activeModal, modalProps, openModal, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
