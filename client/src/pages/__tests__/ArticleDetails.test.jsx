import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ArticleDetails from "../ArticleDetails";
import { fetchArticle } from "../../services/articles";

vi.mock("dompurify", () => ({
  default: {
    sanitize: (html) => html,
  },
}));

vi.mock("marked", () => ({
  marked: {
    parse: (content) => `<p>${content}</p>`,
  },
}));

vi.mock("../../services/articles", () => ({
  fetchArticle: vi.fn(),
}));

describe("ArticleDetails", () => {
  beforeEach(() => {
    fetchArticle.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders article content", async () => {
    fetchArticle.mockResolvedValue({
      item: {
        title: "Intro to Docs",
        content: "Hello world",
        category: "Docs",
        tags: ["onboarding"],
      },
    });

    render(
      <MemoryRouter initialEntries={["/articles/intro"]}>
        <Routes>
          <Route path="/articles/:id" element={<ArticleDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Intro to Docs")).toBeInTheDocument();
    expect(screen.getByText("onboarding")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    fetchArticle.mockRejectedValue(new Error("Article unavailable"));

    render(
      <MemoryRouter initialEntries={["/articles/intro"]}>
        <Routes>
          <Route path="/articles/:id" element={<ArticleDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/article unavailable/i)).toBeInTheDocument();
  });
});
