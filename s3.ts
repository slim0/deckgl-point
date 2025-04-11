import { GetObjectCommand, ListObjectsCommand, S3Client } from "@aws-sdk/client-s3";

export function getAnonymousS3Client(endpoint: string, region: string): S3Client {
  const s3Client = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    signer: {
      sign: (request) => Promise.resolve(request),
    },
    credentials: { accessKeyId: "", secretAccessKey: "" },
  });
  return s3Client
}

export async function listObjectsWithPrefix(
  s3Client: S3Client,
  bucketName: string,
  prefix: string,
): Promise<string[]> {
  const objects: string[] = []
  try {
    const command = new ListObjectsCommand({
      Bucket: bucketName,
      Prefix: prefix,
    });
    const data = await s3Client.send(command);
    if (data.Contents) {
      data.Contents.forEach((object) => {
        object.Key && objects.push(object.Key)
      });
    }
    return objects
  } catch (error) {
    console.error("Error listing objects:", error);
    return objects
  }
}


export async function getObjectByteArray(
  s3Client: S3Client,
  bucketName: string,
  key: string,
): Promise<Uint8Array<ArrayBufferLike> | undefined> {
  const objects: string[] = []
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    })
    const response = await s3Client.send(getObjectCommand);
    return response.Body?.transformToByteArray()
  } catch (error) {
    console.error("Error listing objects:", error);
    return undefined
  }
}
