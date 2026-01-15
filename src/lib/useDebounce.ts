/**
 * Debounce utility for SolidJS
 *
 * Returns a debounced version of a callback function.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  }) as T;

  return debouncedFn;
}
