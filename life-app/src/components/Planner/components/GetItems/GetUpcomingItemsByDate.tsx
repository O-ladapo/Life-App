import { useState, useEffect } from 'react';
import { getUpcomingItemsByDateAndType } from '../../../../api/items';
import type { Item } from '../ItemType';
import type { SetStateAction } from 'react';

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

    useEffect(() => {
        let cancelled = false;

        getUpcomingItemsByDateAndType(date, itemType)
            .then((items) => {
                if (!cancelled) {
                    setState({
                        date,
                        items: items.filter((item: Item) => item.start_at !== null),
                        itemType,
                        error: null,
                    });
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setState({
                        date,
                        items: [],
                        itemType,
                        error: err instanceof Error
                            ? err.message
                            : 'Failed to load items',
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [date, itemType]);

    const isCurrentDate = state.date === date;

    const updateItems = (value: SetStateAction<Item[]>) => {
        setState((previous) => ({
            ...previous,
            items: typeof value === 'function'
                ? value(previous.items)
                : value,
        }));
    };

    return {
        items: isCurrentDate ? state.items : [],
        loading: !isCurrentDate,
        error: isCurrentDate ? state.error : null,
        setUpcomingItems: updateItems,
    };
}