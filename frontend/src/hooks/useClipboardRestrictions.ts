import { useEffect } from "react";

export const useClipboardRestrictions = (isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return;

    const preventClipboardActions = (e: ClipboardEvent) => {
      e.preventDefault();
      // Optional: Add a toast/alert here if you want to notify the user
      // alert("Copying and pasting is disabled for security reasons.");
    };

    // Attach listeners to the document
    document.addEventListener("copy", preventClipboardActions);
    document.addEventListener("cut", preventClipboardActions);
    document.addEventListener("paste", preventClipboardActions);

    // Cleanup listeners on unmount
    return () => {
      document.removeEventListener("copy", preventClipboardActions);
      document.removeEventListener("cut", preventClipboardActions);
      document.removeEventListener("paste", preventClipboardActions);
    };
  }, [isActive]);
};