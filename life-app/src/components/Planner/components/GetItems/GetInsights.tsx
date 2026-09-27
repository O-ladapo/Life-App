import { useState, useEffect, useCallback, useRef } from 'react';
import { getInsights } from '../../../../api/items';
import type { Insights } from '../InsightsType';

export function useGetInsights(date: string) {
    const [state, setState] = useState<{
        date: string | null;
        insights: Insights | null;
        error: string | null;
    }>({
        date: null,
        insights: null,
        error: null,
    });
    const requestIdRef = useRef(0);

    const refetch = useCallback(() => {
        const requestId = ++requestIdRef.current;

        return getInsights(date)
            .then((insights) => {
                if (requestId !== requestIdRef.current) return; 
                setState({
                    date,
                    insights,
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
                    insights: null,
                    error: err instanceof Error
                        ? err.message
                        : 'Failed to load insights',
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
        insights: isCurrentDate ? state.insights : null,
        loading: !isCurrentDate,
        error: isCurrentDate ? state.error : null,
        refetch,
    };
}