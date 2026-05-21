import { useEffect } from "react";

export function useGlobalModalEscape(isOpen: boolean, onClose: (e?: KeyboardEvent) => void) {
    useEffect(() => {
        if (!isOpen) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose(e);
            }
        };

        window.addEventListener("keydown", handler, true);

        return () => {
            window.removeEventListener("keydown", handler, true);
        };
    }, [isOpen, onClose]);
}
