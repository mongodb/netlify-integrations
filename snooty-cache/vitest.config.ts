import { defineConfig } from "vite";

export default defineConfig({
  server: { watch: { ignored: ["**/snooty/**"] } },
  test: {
    name: "test-suite",
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    dir: "test/",
    server: {},
  },
});
