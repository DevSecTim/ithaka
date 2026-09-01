import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";

const uploadsDir = resolve(process.cwd(), process.env.UPLOAD_DIR ?? "../../data/uploads");

function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

function r2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function createUploadTarget(storageKey: string, contentType: string) {
  if (r2Configured()) {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: storageKey,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(r2Client(), command, { expiresIn: 60 * 10 });
    return { uploadUrl, method: "PUT" as const, storageKey, mode: "r2" as const };
  }

  return {
    uploadUrl: `/api/photos/upload?key=${encodeURIComponent(storageKey)}`,
    method: "PUT" as const,
    storageKey,
    mode: "local" as const,
  };
}

export async function putLocalObject(storageKey: string, body: Buffer, contentType: string) {
  const filePath = join(uploadsDir, storageKey);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
  return { storageKey, contentType };
}

export async function getObjectStream(storageKey: string): Promise<{
  stream: Readable;
  contentType: string;
} | null> {
  if (r2Configured() && process.env.R2_PUBLIC_URL) {
    return null;
  }

  if (r2Configured()) {
    const response = await r2Client().send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: storageKey,
      }),
    );
    if (!response.Body) return null;
    return {
      stream: response.Body as Readable,
      contentType: response.ContentType ?? "application/octet-stream",
    };
  }

  const filePath = join(uploadsDir, storageKey);
  if (!existsSync(filePath)) return null;
  return {
    stream: createReadStream(filePath),
    contentType: "application/octet-stream",
  };
}

export function publicPhotoUrl(storageKey: string): string {
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${storageKey}`;
  }
  return `/api/photos/file/${storageKey}`;
}
