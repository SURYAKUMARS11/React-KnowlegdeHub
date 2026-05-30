import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Overview from "../Overview";
import { fetchArticles } from "../../services/articles";
import { fetchActivity, fetchStats } from "../../services/dashboard";

vi.mock("../../services/articles", () => ({
  fetchArticles: vi.fn(),
}));

vi.mock("../../services/dashboard", () => ({
  fetchActivity: vi.fn(),
  fetchStats: vi.fn(),
}));

describe("Overview", () => {
  beforeEach(() => {
    fetchArticles.mockReset();
    fetchActivity.mockReset();
    fetchStats.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders stats after loading", async () => {
    fetchStats.mockResolvedValue({ articles: 5, authors: 2, tags: 3 });
    fetchActivity.mockResolvedValue({ items: [] });
    fetchArticles.mockResolvedValue({ items: [] });

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>
    );

    expect(await screen.findByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows activity and latest articles", async () => {
    fetchStats.mockResolvedValue({ articles: 1, authors: 1, tags: 1 });
    fetchActivity.mockResolvedValue({
      items: [{ id: "evt-1", title: "Tagged", detail: "Added a tag" }],
    });
    fetchArticles.mockResolvedValue({
      items: [{ id: "art-1", title: "Async Patterns", content: "Intro" }],
    });

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>
    );

    expect(await screen.findByText("Tagged")).toBeInTheDocument();
    expect(await screen.findByText("Async Patterns")).toBeInTheDocument();
  });
});
