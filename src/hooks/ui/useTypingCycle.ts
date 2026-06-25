import { useEffect, useState } from 'react';

/**
 * Cycles through phrases with a typewriter effect (shared by hero AI + filter inspiration rows).
 */
export const useTypingCycle = (phrases: readonly string[], paused = false): string => {
    const [typingText, setTypingText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(100);

    useEffect(() => {
        if (paused || phrases.length === 0) return;

        const handleType = () => {
            const i = loopNum % phrases.length;
            const fullText = phrases[i];

            setTypingText(isDeleting
                ? fullText.substring(0, typingText.length - 1)
                : fullText.substring(0, typingText.length + 1));

            let speed = isDeleting ? 30 : 60;
            if (!isDeleting && typingText === fullText) {
                speed = 2500;
                setIsDeleting(true);
            } else if (isDeleting && typingText === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
                speed = 500;
            }
            setTypingSpeed(speed);
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [typingText, isDeleting, loopNum, typingSpeed, paused, phrases]);

    return typingText;
};
