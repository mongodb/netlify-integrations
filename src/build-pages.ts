import { writeFileAsync } from "./utils/fs-async";

interface GetOASpecParams {
  sourceType: string;
  source: string;
  output: string;
  pageSlug: string;
  siteUrl: string;
  siteTitle: string;
}

export const normalizePath = (path: string) => path.replace(/\/+/g, `/`);
export const normalizeUrl = (url: string) => {
  const urlObject = new URL(url);
  urlObject.pathname = normalizePath(urlObject.pathname);
  return urlObject.href;
};
export interface RedocVersionOptions {
  active: {
    apiVersion: string;
    resourceVersion: string;
  };
  rootUrl: string;
  resourceVersions: string[];
}

export async function getBuildOasSpecCommand({
  source,
  sourceType,
  pageSlug,
  output,
  siteUrl,
  siteTitle,
}: GetOASpecParams) {
  try {
    let spec = "";

    if (sourceType === "url") {
      spec = source;
    } else if (sourceType === "local") {
      const localFilePath = `source${source}`;
      spec = localFilePath;
    } else {
      throw new Error(
        `Unsupported source type "${sourceType}" for ${pageSlug}`
      );
    }

    const path = `${output}/${pageSlug}/index.html`;
    const finalFilename = normalizePath(path);
    await writeFileAsync(
      `${process.cwd()}/options.json`,
      JSON.stringify({ siteUrl, siteTitle })
    );
    return `node ${process.cwd()}/redoc/cli/index.js build ${spec} --output ${finalFilename} --options ${process.cwd()}/options.json`;
  } catch (e) {
    console.error(e);
    return "";
  }
}
