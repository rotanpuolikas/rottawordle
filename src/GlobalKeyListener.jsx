import { useEffect } from "react"


function GlobalKeyListener({ current, safeSetCurrent, onChange, onKeyDown, WORD_LENGTH }) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Forward raw event
      onKeyDown?.(e)

      // Enter key
      if (e.key === "Enter") {
        return;
      }

      // Typable characters
      if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.length == 1
      ) {
        safeSetCurrent(current + e.key)
        return;
      }

      // Backspace
      if (e.key === "Backspace" && current.length > 0) {
        safeSetCurrent(current.slice(0, -1))
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, onChange, onKeyDown, WORD_LENGTH]);

  return null;
}

export default GlobalKeyListener;
