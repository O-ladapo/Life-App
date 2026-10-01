import { useState, useEffect, useCallback, useRef } from 'react';
import { getUpcomingItemsByDateAndType } from '../../../../api/items';
import type { Item } from '../ItemType';

export function useUpcomingItemsByDate(date: string, itemType: string) {
    const [state, setState] = useState<{
        date: string | null;
        itemType: string | null;
        items: Item[];
        error: string | null;
    }>({
        date: null,
        items: [],
        itemType: null,
        error: null,
    });
    const requestIdRef = useRef(0);

    const refetch = useCallback(() => {
        const requestId = ++requestIdRef.current;

        return getUpcomingItemsByDateAndType(date, itemType)
            .then((items) => {
                if (requestId !== requestIdRef.current) return;

                setState({
                    date,
                    items: items.filter((item: Item) => item.start_at !== null),
                    itemType,
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
                    itemType,
                    error: error.message,
                });
                throw error;
            });
    }, [date, itemType]);

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