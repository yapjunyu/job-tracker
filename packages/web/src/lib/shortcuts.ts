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
 * Answers a key the job seeker presses anywhere in the app. A key pressed while they are
 * typing is left to the field they are typing in, and so is one something else has already
 * dealt with, such as an arrow key inside an open menu.
 *
 * `handler` is read afresh on every key, so it may close over whatever the page holds now
 * without the shortcut being taken off the window and put back each render.
 */
export function useShortcuts(handler: (event: KeyboardEvent) => void): void {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  }, [handler]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTyping(event.target)) return;
      // A shortcut is a key on its own: Ctrl, Alt and Cmd combinations belong to the browser
      // and to the app's own commands, such as the one that opens quick add.
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      latest.current(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
