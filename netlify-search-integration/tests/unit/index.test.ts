import { describe, expect, afterEach, test, it, vi, beforeAll } from "vitest";
import { generateManifest } from "../../src";
import nodeManifest from "../resources/s3Manifests/node-current.json";
import kotlinManifest from "../resources/s3Manifests/kotlin-upcoming.json";
import * as fs from "fs";
import { Manifest } from "../../src/generateManifest/manifest";
import { ManifestEntry } from "../../src/generateManifest/manifestEntry";
import { getManifest } from "../utils/getManifest";

describe.each([
  { manifestName: "node", s3Manifest: nodeManifest },
  { manifestName: "kotlin", s3Manifest: kotlinManifest },
])("Generate manifests from ast", async ({ manifestName, s3Manifest }) => {
  //generate new manifest
  const manifest = await getManifest(manifestName);

  it("has generated the manifest", async () => {
    expect(manifest).toBeTruthy();
  });

  it("has the correct document length", () => {
    expect(manifest.documents).toHaveLength(s3Manifest.documents.length);
  });

  it("has the correct includeInGlobalSearch value"),
    () => {
      expect(manifest.global).toEqual(s3Manifest.includeInGlobalSearch);
    };
});

describe.each([
  {
    manifestName: "node",
    s3Manifest: nodeManifest,
  },
  { manifestName: "kotlin", s3Manifest: kotlinManifest },
])(
  "has the correct document properties",
  async ({ manifestName, s3Manifest }) => {
    const manifest = await getManifest(manifestName);
    const title = manifest.documents[0].title;

    //TODO: put in a loop to check multiple manifestEntries against each other
    let equivDoc: ManifestEntry;
    for (let document of s3Manifest.documents) {
      if (document.title == manifest.documents[0].title) equivDoc = document;
      continue;
    }

    it("is of type string", () => {
      expect(title).toBeTypeOf("string");
    });

    it("matches the slug", () => {
      //slug
      expect(manifest.documents[0].slug).toEqual(equivDoc.slug);
    });

    it("matches the heading", () => {
      //headings
      expect(manifest.documents[0].headings).toEqual(equivDoc.headings);
    });

    it("matches the paragraphs", () => {
      //paragraphs
      expect(manifest.documents[0].paragraphs).toEqual(equivDoc.paragraphs);
    });

    it("matches the code", () => {
      //code
      expect(manifest.documents[0].code).toEqual(equivDoc.code);
    });
    //preview FAILS
    it("matches preview", () => {
      expect(manifest.documents[0].preview).toEqual(equivDoc.preview);
    });

    //tags
    it("matches tags", () => {
      expect(manifest.documents[0].tags).toEqual(equivDoc.tags);
    });

    //facets
    it("matches facets", () => {
      expect(manifest.documents[0].facets).toEqual(equivDoc.facets);
    });
  }
);

//TODO: test Document creation
describe.each([
  {
    manifestName: "node",
  },
  { manifestName: "kotlin" },
])(
  "given a decoded document generate all of the correct properties",
  async ({ manifestName }) => {
    //declare decoded documents here

    it("should return the proper metadata", () => {});

    it("should return the proper paragraphs", () => {});
    it("should return the proper headings and titles", () => {});
    it("should return the proper slug", () => {});
    it("should return the proper preview", () => {});
    it("should return the proper facets", () => {});
    it("should correctly return whether the document is indexable", () => {});
  }
);
//TODO: given a single decoded entry, use Document function on it
