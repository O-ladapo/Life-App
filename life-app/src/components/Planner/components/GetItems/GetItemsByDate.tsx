import { useState, useEffect, useCallback, useRef } from 'react';
import { getItemsByDate } from '../../../../api/items';
import type { Item } from '../ItemType';

export function useItemsByDate(date: string) {
    const [state, setState] = useState<{
        date: string | null;
        items: Item[];
        error: string | null;
    }>({
        date: null,
        items: [],
        error: null,
    });
    const requestIdRef = useRef(0);

    const refetch = useCallback(() => {
        const requestId = ++requestIdRef.current;

        return getItemsByDate(date)
            .then((items) => {
                if (requestId !== requestIdRef.current) return; 
                setState({
                    date,
                    items: items.filter((item) => item.start_at !== null),
                    error: null,
                });
            })
            .catch((err: unknown) => {
                if (requestId !== requestIdRef.current) return; 

                const error = err instanceof Error
                    ? err
                    : new Error('Failed to load items');
                setState({
                    date,
                    items: [],
                    error: err instanceof Error
                        ? err.message
                        : 'Failed to load items',
                });
                throw error;
            });
    }, [date]);

    useEffect(() => {
        refetch().catch(() => undefined);

        const effectRequestId = requestIdRef.current;

        return () => {
            requestIdRef.current = effectRequestId + 1;
        };
    }, [refetch]);

    const isCurrentDate = state.date === date;

    return {
        items: isCurrentDate ? state.items : [],
        loading: !isCurrentDate,
        error: isCurrentDate ? state.error : null,
        refetch,
    };
}