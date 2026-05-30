import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../Login";
import { AuthContext } from "../../context/AuthContext";
import { login as loginService } from "../../services/auth";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock("../../services/auth", () => ({
  login: vi.fn(),
}));

describe("Login", () => {
  beforeEach(() => {
    navigate.mockReset();
    loginService.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits login details and navigates on success", async () => {
    loginService.mockResolvedValue({
      user: { id: "1", name: "Ada" },
    });

    const setUser = vi.fn();

    render(
      <AuthContext.Provider value={{ setUser }}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await userEvent.type(screen.getByLabelText(/email/i), "ada@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "Secret123!");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(loginService).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "Secret123!",
    });
    expect(setUser).toHaveBeenCalledWith({ id: "1", name: "Ada" });
    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("shows an error on failed login", async () => {
    loginService.mockRejectedValue(new Error("Invalid credentials"));

    render(
      <AuthContext.Provider value={{ setUser: vi.fn() }}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await userEvent.type(screen.getByLabelText(/email/i), "bad@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "badpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
