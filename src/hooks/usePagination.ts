
import { useState, useMemo, useEffect } from 'react';

export function usePagination<T>(data: T[], itemsPerPage: number) {
    const [currentPage, setCurrentPage] = useState(1);

    // Reset to page 1 if data changes (e.g. filtering)
    useEffect(() => {
        setCurrentPage(1);
    }, [data.length]);

    const maxPage = Math.ceil(data.length / itemsPerPage);

    const currentData = useMemo(() => {
        const begin = (currentPage - 1) * itemsPerPage;
        const end = begin + itemsPerPage;
        return data.slice(begin, end);
    }, [data, currentPage, itemsPerPage]);

    const next = () => {
        setCurrentPage((currentPage) => Math.min(currentPage + 1, maxPage));
    };

    const prev = () => {
        setCurrentPage((currentPage) => Math.max(currentPage - 1, 1));
    };

    const jump = (page: number) => {
        const pageNumber = Math.max(1, page);
        setCurrentPage(() => Math.min(pageNumber, maxPage));
    };

    return { 
        next, 
        prev, 
        jump, 
        currentData, 
        currentPage, 
        maxPage,
        totalItems: data.length
    };
}
