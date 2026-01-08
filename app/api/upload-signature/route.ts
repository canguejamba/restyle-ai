import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `restyle/${userId}`;

  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET!)
    .digest("hex");

  return Response.json({
    timestamp,
    signature,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}
