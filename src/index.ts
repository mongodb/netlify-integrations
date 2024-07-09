// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";

const integration = new NetlifyIntegration();
const REDOC_CLI_VERSION = "1.2.3";

// handle installing redoc cli if it's not already installed
integration.addBuildEventHandler(
  "onPreBuild",
  async ({ utils: { run, cache } }) => {
    const hasRedoc = await cache.has("redoc");
    if (hasRedoc) return;

    await run.command(`
    git clone -b @dop/redoc-cli@${REDOC_CLI_VERSION} --depth 1 https://github.com/mongodb-forks/redoc.git redoc \
    # Install dependencies for Redoc CLI
    && cd redoc/ \
    && npm ci --prefix cli/ --omit=dev
  `);

    await cache.save("redoc");
  }
);

// handle building the redoc pages
integration.addBuildEventHandler(
  "onPostBuild",
  async ({ utils: { run } }) => {}
);

export { integration };
