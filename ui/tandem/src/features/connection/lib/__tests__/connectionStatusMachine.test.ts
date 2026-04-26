import { describe, it, expect } from "vitest";

import {
  INITIAL_STATUS,
  transition,
} from "@/features/connection/lib/connectionStatusMachine";

describe("connectionStatusMachine transition", () => {
  it("starts in 'connecting'", () => {
    expect(INITIAL_STATUS).toBe("connecting");
  });

  it("connecting + connect → connected", () => {
    expect(transition("connecting", "connect")).toBe("connected");
  });

  it("connecting + close → failed", () => {
    expect(transition("connecting", "close")).toBe("failed");
  });

  it.each(["connecting", "connected", "failed"] as const)(
    "%s + error → failed",
    (from) => {
      expect(transition(from, "error")).toBe("failed");
    },
  );

  it("connected + close → failed", () => {
    expect(transition("connected", "close")).toBe("failed");
  });

  it.each(["connecting", "connected", "failed"] as const)(
    "%s + reconnect → connecting",
    (from) => {
      expect(transition(from, "reconnect")).toBe("connecting");
    },
  );

  it("error then reconnect then connect ends in connected", () => {
    let s: "connecting" | "connected" | "failed" = "connected";
    s = transition(s, "error");
    expect(s).toBe("failed");
    s = transition(s, "reconnect");
    expect(s).toBe("connecting");
    s = transition(s, "connect");
    expect(s).toBe("connected");
  });
});
