import { ManifestEntry } from "./manifestEntry";
import { writeFile } from "fs";
import { promisify } from "util";
import { BSON } from "bson";
import { Document } from "./document";

import { readdir, readFileSync } from "fs";

const readdirAsync = promisify(readdir);

export class Manifest {
  url?: string;
  global: boolean;
  documents: ManifestEntry[];

  constructor(includeInGlobalSearch: boolean, url: string = "") {
    this.url = url;
    this.global = includeInGlobalSearch;
    this.documents = [];
  }

  addDocument(document: ManifestEntry | null) {
    //Add a document to the manifest
    if (document) {
      writeFile(
        `Output of ${document.slug}`,
        JSON.stringify(document),
        (err) => {
          // In case of a error throw err.
          if (err) throw err;
        }
      );
      this.documents.push(document);
    }
  }

  export() {
    //return the manifest as json
    const manifest = {
      url: this.url,
      includeInGlobalSearch: this.global,
      documents: this.documents,
    };

    return JSON.stringify(manifest);
  }
}

export const generateManifest = async () => {
  // create Manifest object
  const manifest = new Manifest(true);

  //go into documents directory and get list of file entries
  const entries = await readdirAsync("documents", { recursive: true });
  const mappedEntries = entries.map((fileName) => {
    //use a joins here instead
    if (fileName.includes(".bson")) return fileName;
    else return "";
  });

  process.chdir("documents");

  for (const entry of mappedEntries) {
    if (!entry.includes("images") && entry.includes("bson")) {
      console.log(entry);
      //the file is read and decoded
      const decoded = BSON.deserialize(readFileSync(entry));
      // console.log(decoded.ast);

      //put file into Document object
      //export Document object
      const processedDoc = new Document(decoded).exportAsManifest();
      //add document to manifest object
      manifest.addDocument(processedDoc);
    }
  }

  return manifest;
};
