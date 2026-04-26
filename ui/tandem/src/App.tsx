import { useEffect } from "react";

import { AppShell } from "@/app/AppShell";

export const App = () => {
  useEffect(() => {
    if (!window.__TAURI_INTERNALS__) return;
    import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
      getCurrentWindow()
        .show()
        .catch(() => {});
    });
  }, []);

  return <AppShell />;
};
