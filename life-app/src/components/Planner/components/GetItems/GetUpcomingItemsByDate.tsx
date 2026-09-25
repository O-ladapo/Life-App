import { useState, useEffect, useCallback } from 'react';
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

    const refetch = useCallback(() => {
        return getUpcomingItemsByDateAndType(date, itemType)
            .then((items) => {
                setState({
                    date,
                    items: items.filter((item: Item) => item.start_at !== null),
                    itemType,
                    error: null,
                });
            })
            .catch((err: unknown) => {
                setState({
                    date,
                    items: [],
                    itemType,
                    error: err instanceof Error
                        ? err.message
                        : 'Failed to load items',
                });
            });
    }, [date, itemType]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const isCurrentDate = state.date === date;

    return {
        items: isCurrentDate ? state.items : [],
        loading: !isCurrentDate,
        error: isCurrentDate ? state.error : null,
        refetch,
    };
}