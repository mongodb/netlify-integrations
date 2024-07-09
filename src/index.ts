// Documentation: https://sdk.netlify.com
import { deserialize } from "bson";
import { readdir, readFile } from "fs";
import { promisify } from "util";
import { NetlifyIntegration } from "@netlify/sdk";

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);

const integration = new NetlifyIntegration();
const BUNDLE_PATH = `${process.cwd()}/bundle`;
const REDOC_CLI_VERSION = "1.2.3";

// handle installing redoc cli if it's not already installed
integration.addBuildEventHandler(
  "onPreBuild",
  async ({ utils: { run, cache } }) => {
    console.log("Running redoc prebuild");
    const hasRedoc = await cache.has("redoc");
    if (hasRedoc) {
      console.log("Restoring redoc from cache");

      cache.restore("redoc");
      return;
    }

    await run.command(
      `git clone -b @dop/redoc-cli@${REDOC_CLI_VERSION} --depth 1 https://github.com/mongodb-forks/redoc.git redoc`
    );

    await run.command("npm ci --prefix cli/ --omit=dev", {
      cwd: `${process.cwd()}/redoc`,
    });

    await cache.save("redoc");
  }
);

// handle building the redoc pages
integration.addBuildEventHandler("onPostBuild", async ({ utils: { run } }) => {
  console.log("=========== Redoc Integration ================");
  await run.command("unzip bundle.zip -d bundle");

  const siteBson = await readFileAsync(`${BUNDLE_PATH}/site.bson`);

  const siteMetadata = deserialize(siteBson);

  console.log("siteMetadata", siteMetadata);

  console.log("=========== Redoc Integration ================");
});

// cache redoc
integration.addBuildEventHandler(
  "onPostBuild",
  async ({ utils: { cache } }) => {
    await cache.save("redoc");
  }
);

export { integration };
