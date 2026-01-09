import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function toStringUrl(u: any): string {
  return typeof u === "string" ? u : u?.toString?.() ?? String(u);
}

/**
 * Carica un'immagine su Cloudinary e ritorna secure_url.
 * 1) prova upload diretto da URL remoto
 * 2) se Cloudinary non riesce a fetchare (capita), fa fetch lato server e carica via upload_stream
 */
export async function uploadToCloudinary(
  remoteUrl: any,
  userId: string,
  jobId: string,
  index: number
): Promise<string> {
  const urlStr = toStringUrl(remoteUrl);

  const options = {
    folder: `restyle/${userId}/${jobId}`,
    public_id: `v${index}`,
    overwrite: true,
    resource_type: "image" as const,
  };

  try {
    const res = await cloudinary.uploader.upload(urlStr, options);
    return res.secure_url;
  } catch (e) {
    // fallback robusto: scarica noi e poi upload stream
    const r = await fetch(urlStr);
    if (!r.ok) throw new Error(`cloudinary_fetch_failed:${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());

    const uploaded: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      Readable.from(buf).pipe(stream);
    });

    return uploaded.secure_url;
  }
}
