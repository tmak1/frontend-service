import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

// Mock Axios so we don't hit the real backend
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("App Component", () => {
  it("renders the login form by default", () => {
    render(<App />);

    // Check for H1
    expect(screen.getByText(/TaskMaster Login/i)).toBeInTheDocument();

    // Check for inputs
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  it("shows register link", () => {
    render(<App />);
    expect(screen.getByText(/Need an account\? Register/i)).toBeInTheDocument();
  });
});
