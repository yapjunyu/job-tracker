import { useEffect, useRef } from "react";

/** Whether the job seeker is typing into something, so a letter they press is theirs. */
export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  );
}

/**
 * Hands every key pressed anywhere in the app to `handler`, which is read afresh on every
 * key, so it may close over whatever the page holds now without the listener being taken off
 * the window and put back each render.
 */
function useKeyDown(handler: (event: KeyboardEvent) => void): void {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  }, [handler]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      latest.current(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}

/**
 * Answers a key the job seeker presses anywhere in the app. A key pressed while they are
 * typing is left to the field they are typing in, and so is one something else has already
 * dealt with, such as an arrow key inside an open menu.
 */
export function useShortcuts(handler: (event: KeyboardEvent) => void): void {
  useKeyDown((event) => {
    if (event.defaultPrevented || isTyping(event.target)) return;
    // A shortcut is a key on its own: Ctrl, Alt and Cmd combinations belong to the browser
    // and to the app's own commands, such as the one that opens the command palette.
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    handler(event);
  });
}

/** What the key that opens the command palette is called on the keyboard in front of them. */
export const commandKeyLabel =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "Cmd" : "Ctrl";

/**
 * Answers Ctrl+K, or Cmd+K on a Mac. It is a command rather than a plain key, so unlike every
 * other shortcut it answers even while the job seeker is typing into a field: quick add is
 * one press away from a half-written search as much as from anywhere else.
 */
export function useCommandKey(onPress: () => void): void {
  useKeyDown((event) => {
    if (event.defaultPrevented || event.altKey) return;
    if (event.key.toLowerCase() !== "k" || !(event.ctrlKey || event.metaKey)) return;
    // Taken off the browser, which has its own use for this one in some windows.
    event.preventDefault();
    onPress();
  });
}
