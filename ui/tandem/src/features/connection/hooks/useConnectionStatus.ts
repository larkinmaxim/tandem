import { useEffect, useState } from "react";

import { getClient } from "@/shared/api/acpConnection";
import {
  INITIAL_STATUS,
  transition,
  type ConnectionEvent,
  type ConnectionStatus,
} from "@/features/connection/lib/connectionStatusMachine";

export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(INITIAL_STATUS);

  useEffect(() => {
    let cancelled = false;
    const send = (event: ConnectionEvent) => {
      if (cancelled) return;
      setStatus((current) => transition(current, event));
    };

    getClient()
      .then((client) => {
        send("connect");
        client.closed.then(() => send("close")).catch(() => send("error"));
      })
      .catch(() => send("error"));

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
