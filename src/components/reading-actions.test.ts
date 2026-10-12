// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReadingActions } from "./reading-actions";

const KEY = "frontier-radar-reading-state-v1";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("card save action", () => {
  it("saves and unsaves a card, synchronizes the detail action, and preserves read state", () => {
    localStorage.setItem(KEY, JSON.stringify({ card: { saved: false, read: true } }));
    render(createElement(ReadingActions, { itemId: "card", compact: true }));
    render(createElement(ReadingActions, { itemId: "card" }));

    fireEvent.click(screen.getByRole("button", { name: "收藏，稍后阅读" }));
    expect(screen.getByRole("button", { name: "取消收藏" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "已收藏" }).getAttribute("aria-pressed")).toBe("true");
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ card: { saved: true, read: true } });

    fireEvent.click(screen.getByRole("button", { name: "取消收藏" }));
    expect(screen.getByRole("button", { name: "收藏" }).getAttribute("aria-pressed")).toBe("false");
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ card: { saved: false, read: true } });
  });

  it("restores a previously saved card when mounted", () => {
    localStorage.setItem(KEY, JSON.stringify({ card: { saved: true, read: false } }));
    render(createElement(ReadingActions, { itemId: "card", compact: true }));
    expect(screen.getByRole("button", { name: "取消收藏" }).getAttribute("aria-pressed")).toBe("true");
  });
});
