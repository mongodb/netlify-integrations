import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./packages/persistence-module/vitest.config.ts",
  "./packages/persistence-module/vitest.config.js",
  "./packages/git-changed-files/vitest.config.ts",
  "./packages/git-changed-files/vitest.config.js",
  "./packages/search-manifest/vitest.config.ts"
])
