import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { assertTrailingSlash } from "../uploadToAtlas/utils";
import { connectToS3 } from "./connectToS3";

const upload = async (
  client: S3Client,
  params: { Bucket: string; Key: string; Body: string }
) => {
  try {
    const command = new PutObjectCommand(params);
    const response = await client.send(command);
    return response;
  } catch (e) {
    throw new Error(`Error uploading manifests to s3 ${e}`);
  }
};

export const uploadManifestToS3 = async ({
  bucket,
  prefix,
  fileName,
  manifest,
}: {
  bucket: string;
  prefix: string;
  fileName: string;
  manifest: string;
}) => {
  let client: S3Client;
  //TODO: maybe also ensure there isn't a double trailing slash here to begin with ?? (altho idk y there would be)
  prefix = assertTrailingSlash(prefix);
  const key = prefix + fileName;
  try {
    client = connectToS3();
  } catch (e) {
    throw e;
  }
  const putObjectParams = {
    Bucket: bucket,
    Key: key,
    Body: manifest,
  };
  const uploadStatus = await upload(client, putObjectParams);
  return uploadStatus;
};
