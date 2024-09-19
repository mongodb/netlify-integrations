import { ManifestEntry } from "./manifestEntry";

export class Manifest {
  url: string;
  global: boolean;
  documents: ManifestEntry[];

  constructor(url: string = "", includeInGlobalSearch: boolean = false) {
    this.url = url;
    this.documents = [];
    this.global = includeInGlobalSearch;
  }

  addDocument(document: ManifestEntry | null) {
    //Add a document to the manifest
    if (document) {
      this.documents.push(document);
    }
  }

  export() {
    //return the manifest as JSON formatted string
    const manifest = {
      url: this.url,
      includeInGlobalSearch: this.global,
      documents: this.documents,
    };

    //TODO: check that .stringify has exactly the same functionality + output as python "dumps" as was used in Mut
    return JSON.stringify(manifest);
  }
}
