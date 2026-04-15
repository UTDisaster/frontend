import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of the given callback.
 * The returned function delays invocation until `delay` ms have elapsed
 * since the last call.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<A extends any[]>(
    callback: (...args: A) => void,
    delay: number,
): (...args: A) => void {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    // Clear pending timer on unmount to avoid firing against an unmounted component
    useEffect(() => {
        return () => {
            if (timerRef.current !== null) clearTimeout(timerRef.current);
        };
    }, []);

    return useCallback(
        (...args: A) => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                callbackRef.current(...args);
            }, delay);
        },
        [delay],
    );
}
