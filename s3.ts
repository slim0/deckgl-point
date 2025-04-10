import { GetObjectCommand, ListObjectsCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "waw3-1", 
  endpoint: "https://minio.dive.edito.eu",
  forcePathStyle: true,
  signer: {
    sign: (request) => Promise.resolve(request),
  },
  credentials: { accessKeyId: "", secretAccessKey: "" },
});

export async function listObjectsWithPrefix(
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

export async function getObject(
  bucketName: string,
  key: string,
): Promise<any> {
  const objects: string[] = []
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    })
    s3Client.send(getObjectCommand, (err, data) => {
      if (err) {
        throw err
      } else {
        return data?.Body
      }
    });
    return objects
  } catch (error) {
    console.error("Error listing objects:", error);
    return objects
  }
}
