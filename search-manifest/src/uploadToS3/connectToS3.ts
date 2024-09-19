import { S3Client } from "@aws-sdk/client-s3";

export const connectToS3 = (): S3Client => {
  const client = new S3Client({
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESSS_KEY ?? "",
    },
    region: "us-east-2",
  });
  return client;
};
