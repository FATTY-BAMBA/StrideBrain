import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initialHomeChatState } from "@/modules/home-intelligence/chat-contracts";

const root = process.cwd();
const source = (path: string) => readFileSync(join(root, path), "utf8");

describe("Home chat server/client state boundary", () => {
  it("provides a real serializable initial state", () => {
    expect(initialHomeChatState).toEqual({ turns: [], context: {} });
    expect(Array.isArray(initialHomeChatState.turns)).toBe(true);
  });

  it("does not import client state from a use-server module", () => {
    const chat = source("src/components/demo-value/home-chat.tsx");
    const actions = source("src/app/[locale]/home-chat-actions.ts");
    expect(chat).toContain(
      'import { initialHomeChatState } from "@/modules/home-intelligence/chat-contracts"',
    );
    expect(chat).not.toMatch(
      /import\s*\{[^}]*initialHomeChatState[^}]*\}\s*from\s*["']@\/app\/\[locale\]\/home-chat-actions["']/,
    );
    expect(actions).toMatch(/^"use server";/);
    expect(actions).not.toContain("export const initialHomeChatState");
  });
});
