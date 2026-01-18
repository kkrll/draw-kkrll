/**
 * Popover positioning fallback for browsers without CSS Anchor Positioning
 * (Safari, Firefox as of Jan 2025)
 */

// Check if CSS anchor positioning is supported
export const supportsAnchorPositioning =
  typeof CSS !== 'undefined' && CSS.supports('anchor-name', '--test');

/**
 * Positions a popover below a trigger element, centered horizontally.
 * Call this in onMount for components using the popover API.
 */
export function setupPopoverPosition(
  triggerEl: HTMLElement | undefined,
  popoverEl: HTMLElement | undefined
): void {
  if (supportsAnchorPositioning || !triggerEl || !popoverEl) return;

  popoverEl.addEventListener('toggle', ((e: ToggleEvent) => {
    if (e.newState === 'open') {
      const rect = triggerEl.getBoundingClientRect();
      popoverEl.style.position = 'fixed';
      popoverEl.style.top = `${rect.bottom + 4}px`;
      popoverEl.style.left = `${rect.left + rect.width / 2}px`;
      popoverEl.style.transform = 'translateX(-50%)';
    }
  }) as EventListener);
}
