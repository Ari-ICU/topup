"use client";

import { useEffect } from "react";

/**
 * TabPolish Component
 * Handles the dynamic browser tab title to re-engage users when they switch tabs.
 */
export function TabPolish() {
  useEffect(() => {
    const originalTitle = document.title;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When user leaves the tab
        document.title = "Hey! 💎 Don't forget your diamonds!";
      } else {
        // When user comes back
        document.title = originalTitle;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.title = originalTitle;
    };
  }, []);

  return null; // This component doesn't render anything UI-wise
}
