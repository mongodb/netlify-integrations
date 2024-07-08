// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { deserialize } from "bson";
import { readdir, readFile } from "fs";
import { promisify } from "util";

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);

const integration = new NetlifyIntegration();
const ZIP_PATH = `${process.cwd()}/bundle/documents`;

integration.addBuildEventHandler(
  "onSuccess",
  async ({ utils: { run, git } }) => {
    console.log("=========== Chatbot Data Upload Integration ================");
    await run.command("unzip bundle.zip -d bundle");

    console.log(git.deletedFiles);

    const zipContents = await readdirAsync(ZIP_PATH, {
      recursive: true,
    });

    const bsonPages = zipContents.filter((fileName) => {
      const splitFile = fileName.toString().split(".");

      console.log("splitFile: ", splitFile);

      return splitFile[splitFile.length - 1] === "bson";
    });
    console.log("ZipPages: ", bsonPages);

    const pageAstObjects = await Promise.all(
      bsonPages.map(async (bsonFileName) => {
        const rawData = await readFileAsync(`${ZIP_PATH}/${bsonFileName}`);

        return deserialize(rawData);
      })
    );

    console.log("pageAstObjects", pageAstObjects);

    console.log("=========== Chatbot Data Upload Integration ================");
  }
);

export { integration };
