import { describe, expect, test, vi } from "vitest";

vi.stubEnv("REPO_NAME", "dummyName");
expect(process.env.REPO_NAME === "REPO_NAME");
