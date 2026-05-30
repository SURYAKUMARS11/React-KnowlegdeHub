import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Categories from "../Categories";
import { fetchCategories } from "../../services/dashboard";

vi.mock("../../services/dashboard", () => ({
  fetchCategories: vi.fn(),
}));

describe("Categories", () => {
  beforeEach(() => {
    fetchCategories.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders categories when data is available", async () => {
    fetchCategories.mockResolvedValue({
      items: [{ name: "Guides", count: 3 }],
    });

    render(<Categories />);

    expect(await screen.findByText("Guides")).toBeInTheDocument();
    expect(screen.getByText("3 articles")).toBeInTheDocument();
  });

  it("shows an error when the request fails", async () => {
    fetchCategories.mockRejectedValue(new Error("Network down"));

    render(<Categories />);

    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });
});
