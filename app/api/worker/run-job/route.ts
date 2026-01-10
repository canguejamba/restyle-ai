import Replicate from "replicate";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { uploadToCloudinary } from "@/lib/cloudinaryAdmin";
import { refundIfCharged } from "@/lib/credits";

export const runtime = "nodejs";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
const COST_PER_JOB = 4;

async function toUrl(item: any): Promise<string> {
  if (typeof item === "string") return item;
  if (item instanceof URL) return item.toString();

  if (item && typeof item.url === "function") {
    const u = await item.url();
    return typeof u === "string" ? u : u?.toString?.() ?? String(u);
  }

  if (item && typeof item.href === "string") return item.href;

  return String(item);
}


function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ROOM_PACK: Record<string, string> = {
  "living room":
    "Add a complete living set: 1 large sofa (or sectional), 1 coffee table, 1 rug, 1 side table, 1 floor lamp, 1–2 accent chairs, plants, and wall art. Keep circulation paths clear. No bed elements.",
  bedroom:
    "Add a complete bedroom set: bed frame with headboard, bedding, 2 nightstands, 2 bedside lamps, wardrobe or dresser, curtains, rug, and minimal decor. Make it cozy and restful.",
  kitchen:
    "Add a complete kitchen look: modern cabinetry, cohesive countertops, backsplash, pendant lighting, bar stools if applicable, and tasteful appliances. Keep it functional and clean.",
  bathroom:
    "Add a spa-like bathroom look: vanity, mirror, lighting, towel rails, subtle decor, clean tiles, and a cohesive palette. No clutter, no messy toiletries.",
  "dining room":
    "Add a complete dining set: dining table, chairs, pendant light, rug, sideboard, table setting, and wall art. Elegant and social.",
  "home office":
    "Add a complete home office set: desk, ergonomic chair, shelves/storage, task lamp, minimal decor, plants. Productive, uncluttered, professional.",
};

const STYLE_PACK: Record<string, string> = {
  "modern minimal":
    "Modern Minimal: clean lines, neutral palette (white/gray/black), minimal decor, hidden storage, matte finishes, simple geometric furniture.",
  scandinavian:
    "Scandinavian: light woods (oak/birch), airy whites, soft textiles, cozy rug, simple shapes, warm ambient lighting.",
  japandi:
    "Japandi: minimal + warmth, natural woods, muted earth tones, low-profile furniture, linen textiles, calm zen styling, wabi-sabi touches.",
  industrial:
    "Industrial: concrete/metal accents, black steel frames, reclaimed wood, exposed textures, bold lighting fixtures, urban loft vibe.",
  "contemporary luxury":
    "Contemporary Luxury: polished high-end look, premium materials (marble, walnut, brass), statement lighting, curated art, upscale hotel vibe.",
  "warm mediterranean":
    "Warm Mediterranean: sun-kissed palette, textured plaster, terracotta/cream tones, natural materials, woven accents, warm cozy lighting.",
};

const INTENSITY_PACK: Record<string, string> = {
  low: "Keep changes subtle and faithful to the original. Same architectural features. Minimal transformation.",
  medium:
    "Balanced redesign: noticeable furniture + materials upgrade while staying realistic and coherent.",
  high: "More creative wow-factor: bolder furniture choices, stronger styling, more dramatic but still realistic and tasteful.",
};

export const POST = verifySignatureAppRouter(async (req: Request) => {
  const { jobId } = await req.json();

  const { data: job } = await supabaseAdmin
    .from("jobs")
    .select(
      "id,user_id,status,model,params,input_image_url,room_type,style,intensity"
    )
    .eq("id", jobId)
    .single();

  if (!job) return Response.json({ ok: false }, { status: 404 });
  if (job.status !== "queued") return Response.json({ ok: true }); // idempotent

  await supabaseAdmin
    .from("jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId);

  const roomExtra = ROOM_PACK[norm(job.room_type)] ?? "";
  const styleExtra = STYLE_PACK[norm(job.style)] ?? "";
  const intensityKey = (job as any).intensity as
    | "low"
    | "medium"
    | "high"
    | undefined;
  const intensityExtra = intensityKey ? INTENSITY_PACK[intensityKey] ?? "" : "";

  const prompt = [
    `High-end ${job.room_type} interior redesign in ${job.style} style.`,
    "Fully furnished, cohesive furniture set, realistic materials, natural daylight, magazine photo, ultra realistic.",
    roomExtra,
    styleExtra,
    intensityExtra,
    // anti-bug / anti-trash
    "Keep the same room layout, walls, ceiling height, window/door positions, floor footprint, and camera angle.",
    "No text, no watermark, no logo, no signature. Windows should look natural and bright (no blackout blinds).",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const output = await replicate.run(job.model as any, {
      input: {
        image: job.input_image_url,
        prompt,
        ...(job.params ?? {}),
      },
    });

    const arr = Array.isArray(output) ? output : (output as any)?.output ?? [];
    if (!Array.isArray(arr) || arr.length === 0) throw new Error("no_outputs");

    // spesso il primo elemento è la canny map -> prendiamo le ultime 4
    const picked = arr.length > 4 ? arr.slice(-4) : arr;
    const urls = await Promise.all(picked.map(toUrl));

    // upload su Cloudinary per persistenza
    const cloudUrls = await Promise.all(
      urls.map((u, idx) => uploadToCloudinary(u, job.user_id, jobId, idx))
    );

    const inserts = cloudUrls.map((url, idx) => ({
      job_id: jobId,
      image_url: url,
      index: idx,
    }));

    const { error: outErr } = await supabaseAdmin
      .from("job_outputs")
      .insert(inserts);
    if (outErr) throw new Error("db_insert_outputs_failed");

    await supabaseAdmin
      .from("jobs")
      .update({ status: "succeeded", finished_at: new Date().toISOString() })
      .eq("id", jobId);

    return Response.json({ ok: true });
  } catch (e: any) {
    await supabaseAdmin
      .from("jobs")
      .update({
        status: "failed",
        error: String(e?.message ?? "unknown_error"),
        finished_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await refundIfCharged(job.user_id, jobId, COST_PER_JOB);

    // IMPORTANT: torna 200 così QStash NON ritenta all’infinito.
    return Response.json({ ok: false }, { status: 200 });
  }
});
