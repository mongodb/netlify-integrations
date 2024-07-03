// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { readdir } from "fs";
import { promisify } from "util";

const readdirAsync = promisify(readdir);
const integration = new NetlifyIntegration();

integration.addBuildEventHandler(
  "onSuccess",
  async ({ utils: { run, git } }) => {
    console.log("=========== Chatbot Data Upload Integration ================");
    await run.command("unzip bundle.zip -d bundle");

    const zipContents = await readdirAsync(
      `${process.cwd()}/bundle/documents`,
      {
        recursive: true,
      }
    );

    const bsonPages = zipContents.filter((fileName) => {
      const splitFile = fileName.toString().split(".");

      console.log("splitFile: ", splitFile);

      return splitFile[splitFile.length - 1] === "bson";
    });
    console.log("ZipPages: ", bsonPages);

    console.log("=========== Chatbot Data Upload Integration ================");
  }
);

export { integration };
