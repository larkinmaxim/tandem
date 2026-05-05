import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function ThemeConsumer() {
  const { theme, setTheme, accentColor, density } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="accent">{accentColor}</span>
      <span data-testid="density">{density}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        Set Dark
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        Set Light
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
  });

  it("provides default theme as system", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
  });

  it("switches to dark theme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    await user.click(screen.getByText("Set Dark"));
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists theme to localStorage under tandem-* key", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    await user.click(screen.getByText("Set Light"));
    expect(localStorage.getItem("tandem-theme")).toBe("light");
    expect(localStorage.getItem("goose-theme")).toBeNull();
  });

  it("provides default accent color", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("accent")).toHaveTextContent("#8b7cff");
  });

  it("provides default density", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("density")).toHaveTextContent("comfortable");
  });

  describe("localStorage migration", () => {
    it("migrates goose-* keys to tandem-* on import", async () => {
      localStorage.setItem("goose-theme", "dark");
      localStorage.setItem("goose-accent-color", "#ef4444");
      localStorage.setItem("goose-density", "compact");

      // Re-import to trigger migration
      const mod = await import("./ThemeProvider?migrate-test-1");
      const { ThemeProvider: TP, useTheme: ut } = mod;

      function Consumer() {
        const { theme, accentColor, density } = ut();
        return (
          <div>
            <span data-testid="m-theme">{theme}</span>
            <span data-testid="m-accent">{accentColor}</span>
            <span data-testid="m-density">{density}</span>
          </div>
        );
      }

      render(
        <TP>
          <Consumer />
        </TP>,
      );

      expect(screen.getByTestId("m-theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("m-accent")).toHaveTextContent("#ef4444");
      expect(screen.getByTestId("m-density")).toHaveTextContent("compact");

      expect(localStorage.getItem("tandem-theme")).toBe("dark");
      expect(localStorage.getItem("tandem-accent-color")).toBe("#ef4444");
      expect(localStorage.getItem("tandem-density")).toBe("compact");
      expect(localStorage.getItem("goose-theme")).toBeNull();
      expect(localStorage.getItem("goose-accent-color")).toBeNull();
      expect(localStorage.getItem("goose-density")).toBeNull();
    });

    it("does not overwrite existing tandem-* keys during migration", async () => {
      localStorage.setItem("goose-theme", "light");
      localStorage.setItem("tandem-theme", "dark");

      const mod = await import("./ThemeProvider?migrate-test-2");
      const { ThemeProvider: TP, useTheme: ut } = mod;

      function Consumer() {
        const { theme } = ut();
        return <span data-testid="m2-theme">{theme}</span>;
      }

      render(
        <TP>
          <Consumer />
        </TP>,
      );

      expect(screen.getByTestId("m2-theme")).toHaveTextContent("dark");
      expect(localStorage.getItem("tandem-theme")).toBe("dark");
      expect(localStorage.getItem("goose-theme")).toBeNull();
    });

    it("is idempotent — running twice is safe", async () => {
      localStorage.setItem("tandem-theme", "light");
      localStorage.setItem("tandem-accent-color", "#22c55e");

      const mod = await import("./ThemeProvider?migrate-test-3");
      const { ThemeProvider: TP, useTheme: ut } = mod;

      function Consumer() {
        const { theme, accentColor } = ut();
        return (
          <div>
            <span data-testid="m3-theme">{theme}</span>
            <span data-testid="m3-accent">{accentColor}</span>
          </div>
        );
      }

      render(
        <TP>
          <Consumer />
        </TP>,
      );

      expect(screen.getByTestId("m3-theme")).toHaveTextContent("light");
      expect(screen.getByTestId("m3-accent")).toHaveTextContent("#22c55e");
    });
  });
});
