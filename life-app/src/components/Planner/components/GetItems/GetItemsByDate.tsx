import { useState, useEffect } from 'react';
import { getItemsByDate } from '../../../../api/items';
import type { Item } from '../ItemType';
import type { SetStateAction } from 'react';

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

    useEffect(() => {
        let cancelled = false;

        getItemsByDate(date)
            .then((items) => {
                if (!cancelled) {
                    setState({
                        date,
                        items,
                        error: null,
                    });
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setState({
                        date,
                        items: [],
                        error: err instanceof Error
                            ? err.message
                            : 'Failed to load items',
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [date]);

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
        setItems: updateItems,
    };
}