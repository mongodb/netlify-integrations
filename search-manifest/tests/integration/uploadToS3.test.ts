import { beforeEach, describe, expect, test, vi } from "vitest";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { getManifest } from "../utils/getManifest";
import { uploadManifestToS3 } from "../../src/uploadToS3/uploadManifest";

const manifest = await getManifest("node");
const projectName = `node`;
const branch = `master`;
beforeEach(async () => {
  const s3Mock = mockClient(S3Client);
  s3Mock.on(PutObjectCommand).resolves({});
  vi.mock("../../src/uploadToS3/connectToS3.ts", async () => {
    return {
      connectToS3: () => {
        return new S3Client({});
      },
    };
  });
});

const uploadParams = {
  bucket: "docs-search-indexes-test",
  prefix: "search-indexes/ab-testing",
  fileName: `${projectName}-${branch}.json`,
  manifest: manifest.export(),
};

describe("upload manifest to S3 behaves as expected", () => {
  test("tests upload manifest to S3", async () => {
    expect(uploadManifestToS3(uploadParams)).resolves.toStrictEqual({});
  });
});
