import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { assertTrailingSlash } from "../uploadToAtlas/utils";
import { connectToS3 } from "./connectToS3";

const upload = async (
  client: S3Client,
  bucket: string,
  key: string,
  manifest: string
) => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: manifest,
    });
    const response = await client.send(command);
    return response;
  } catch (e) {
    throw e;
  }
};

export const upload_manifest_to_s3 = async (
  bucket: string,
  prefix: string,
  fileName: string,
  manifest: string
) => {
  let client;
  //TODO, maybe also ensure there isn't a double trailing slash here to begin with ?? (altho idk y there would be)
  prefix = assertTrailingSlash(prefix);
  const key = prefix + fileName;
  try {
    client = connectToS3();
  } catch (e) {
    throw e;
  }
  const uploadStatus = await upload(client, bucket, key, manifest);
  return uploadStatus;
};
