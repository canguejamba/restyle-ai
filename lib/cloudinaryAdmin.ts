// lib/cloudinaryAdmin.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadToCloudinary(
  remoteUrl: string,
  userId: string,
  jobId: string,
  index: number
) {
  const res = await cloudinary.uploader.upload(remoteUrl, {
    folder: `restyle/${userId}/${jobId}`,
    public_id: `v${index}`,
    overwrite: true,
    resource_type: "image",
  });

  return res.secure_url;
}
