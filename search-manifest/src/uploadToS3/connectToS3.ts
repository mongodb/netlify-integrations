import { S3Client } from "@aws-sdk/client-s3";

export const connectToS3 = () => {
  const client = new S3Client({
    credentials: {
      accessKeyId: "",
      secretAccessKey: "",
    },
  });
};
