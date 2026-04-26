import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (cmd: string) => {
    if (cmd === "get_goose_serve_url") return "ws://127.0.0.1:54321/acp";
    return undefined;
  }),
  convertFileSrc: (s: string) => s,
}));

vi.mock("@/shared/api/acpConnection", () => ({
  getClient: vi.fn(() => new Promise(() => {})),
  isClientReady: vi.fn(() => false),
  getClientSync: vi.fn(() => null),
  setNotificationHandler: vi.fn(),
}));

import { BootstrapScreen } from "../BootstrapScreen";

describe("BootstrapScreen", () => {
  it("renders all five seam regions", () => {
    render(<BootstrapScreen />);
    for (let i = 1; i <= 5; i += 1) {
      expect(screen.getByTestId(`seam-${i}`)).toBeInTheDocument();
    }
  });

  it("shows the Tauri seam as passing once invoke resolves", async () => {
    render(<BootstrapScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("seam-1")).toHaveAttribute(
        "data-status",
        "pass",
      );
    });
    expect(screen.getByTestId("seam-1")).toHaveTextContent(
      "ws://127.0.0.1:54321/acp",
    );
  });

  it("renders the accent swatch and shadcn Button", () => {
    render(<BootstrapScreen />);
    expect(screen.getByTestId("accent-swatch")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /default/i }),
    ).toBeInTheDocument();
  });

  it("displays a hydration status line for the two stores", () => {
    render(<BootstrapScreen />);
    const seam5 = screen.getByTestId("seam-5");
    expect(seam5).toHaveTextContent(/chatSessionStore\.sessions\.length/);
    expect(seam5).toHaveTextContent(/providerInventoryStore\.entries\.size/);
  });
});
