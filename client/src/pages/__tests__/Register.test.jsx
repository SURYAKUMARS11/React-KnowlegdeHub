import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "../Register";
import { AuthContext } from "../../context/AuthContext";
import { register as registerService } from "../../services/auth";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock("../../services/auth", () => ({
  register: vi.fn(),
}));

describe("Register", () => {
  beforeEach(() => {
    navigate.mockReset();
    registerService.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows an error when passwords do not match", async () => {
    render(
      <AuthContext.Provider value={{ setUser: vi.fn() }}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await userEvent.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await userEvent.type(screen.getByLabelText(/email/i), "ada@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "Secret123!");
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "Secret1234!"
    );
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(registerService).not.toHaveBeenCalled();
  });

  it("submits registration details and navigates on success", async () => {
    registerService.mockResolvedValue({
      user: { id: "1", name: "Ada" },
    });

    render(
      <AuthContext.Provider value={{ setUser: vi.fn() }}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await userEvent.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await userEvent.type(screen.getByLabelText(/email/i), "ada@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "Secret123!");
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      "Secret123!"
    );
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(registerService).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Secret123!",
      role: "user",
    });
    expect(navigate).toHaveBeenCalledWith("/login");
  });
});
