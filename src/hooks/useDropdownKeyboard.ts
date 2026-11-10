import { RefObject, useEffect, useRef } from "react";

/**
 * Keyboard handling for the plugin's custom dropdowns (listbox of option
 * buttons):
 * - ↓ / ↑ on the closed dropdown opens it and focuses the selected option
 * - ↑ / ↓ / Home / End move between options; Enter / Space choose one
 *   (options are buttons)
 * - Escape closes and returns focus to the dropdown button; Tab closes
 *
 * @returns The onKeyDown handler for the dropdown's root element
 */
export function useDropdownKeyboard(
  rootRef: RefObject<HTMLElement | null>,
  buttonRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  setIsOpen: (open: boolean) => void
): (event: React.KeyboardEvent) => void {
  const focusOptionOnOpen = useRef(false);

  const getOptions = (): HTMLElement[] =>
    Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []
    );

  // After opening from the keyboard, focus the selected (or first) option
  useEffect(() => {
    if (!isOpen || !focusOptionOnOpen.current) return;
    focusOptionOnOpen.current = false;
    const options = getOptions();
    const selected = options.find(
      (option) => option.getAttribute("aria-selected") === "true"
    );
    (selected ?? options[0])?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
      return;
    }

    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        focusOptionOnOpen.current = true;
        setIsOpen(true);
      }
      return;
    }

    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }

    const options = getOptions();
    if (options.length === 0) return;
    const current = options.indexOf(document.activeElement as HTMLElement);
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = current < 0 ? 0 : Math.min(options.length - 1, current + 1);
        break;
      case "ArrowUp":
        next = current < 0 ? options.length - 1 : Math.max(0, current - 1);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = options.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    options[next].focus();
  };
}
