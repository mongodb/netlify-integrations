// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";
import { deserialize } from "bson";
import { readdir, readFile } from "fs";
import { promisify } from "util";

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);

const integration = new NetlifyIntegration();
const ZIP_PATH = `${process.cwd()}/bundle/documents`;

interface StaticAsset {
  checksum: string;
  key: string;
  updated_at?: Date;
}
interface PageAst {
  type: string;
  position: Record<string, unknown>;
  children: PageAst[];
  fileid: string;
  options: Record<string, unknown>;
}
interface Page {
  page_id: string;
  filename: string;
  ast: PageAst;
  source: string;
  static_assets: StaticAsset[];
}

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

      return splitFile[splitFile.length - 1] === "bson";
    });

    const pageAstObjects = await Promise.all(
      bsonPages.map(async (bsonFileName) => {
        const rawData = await readFileAsync(`${ZIP_PATH}/${bsonFileName}`);

        return deserialize(rawData) as Page;
      })
    );

    console.log("=========== Chatbot Data Upload Integration ================");
  }
);

export { integration };
