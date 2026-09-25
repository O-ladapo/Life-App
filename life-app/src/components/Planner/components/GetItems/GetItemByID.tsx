import { useState, useEffect } from 'react';
import { getItemById } from '../../../../api/items';
import type { Item } from '../ItemType';

export function useItemById(id: number) {
    const [state, setState] = useState<{
        item: Item | null;
        loadedId: number | null;
        error: string | null;
    }>({
        item: null,
        loadedId: null,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;

        getItemById(id)
            .then((item) => {
                if (!cancelled) {
                    setState({
                        item,
                        loadedId: id,
                        error: null,
                    });
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setState({
                        item: null,
                        loadedId: id,
                        error: err instanceof Error
                            ? err.message
                            : 'Failed to load item',
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    return {
        item: state.loadedId === id ? state.item : null,
        loading: state.loadedId !== id,
        error: state.loadedId === id ? state.error : null,
    };
}