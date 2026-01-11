"use client";

import { useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

type Slide = { src: string; alt?: string; download?: string };

type LightboxGalleryProps = {
  // thumb: small image for grid
  // full: ORIGINAL Cloudinary URL (no transforms)
  images: { thumb: string; full: string; alt?: string }[];
  className?: string;
};

function isCloudinaryUrl(url: string) {
  return url.includes("res.cloudinary.com") && url.includes("/upload/");
}

function isTransformSegment(seg: string) {
  // Cloudinary transformation segments almost always contain commas (e.g. w_800,c_limit,q_auto)
  // Folder/public_id segments won't contain commas.
  if (seg.includes(",")) return true;

  // Some transforms can be single tokens without commas.
  const prefixes = [
    "w_",
    "h_",
    "c_",
    "q_",
    "f_",
    "g_",
    "ar_",
    "dpr_",
    "fl_",
    "e_",
    "t_",
    "l_",
    "b_",
    "bo_",
    "co_",
    "o_",
    "r_",
    "x_",
    "y_",
    "z_",
  ];
  return prefixes.some((p) => seg.startsWith(p));
}

/**
 * Returns the "base/original" Cloudinary URL by stripping any transformation segments.
 * Works both with and without version (v123...) URLs.
 */
function cloudinaryBaseUrl(url: string) {
  if (!url || !isCloudinaryUrl(url)) return url;

  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const uploadIdx = parts.indexOf("upload");
    if (uploadIdx === -1) return url;

    const before = parts.slice(0, uploadIdx + 1); // includes 'upload'
    const after = parts.slice(uploadIdx + 1);

    // Drop all leading transform segments (can be multiple) until we hit either version or public_id
    while (after.length > 0) {
      const seg = after[0];
      if (/^v\d+$/.test(seg)) break;
      if (!isTransformSegment(seg)) break;
      after.shift();
    }

    u.pathname = "/" + [...before, ...after].join("/");
    return u.toString();
  } catch {
    return url;
  }
}

function withCloudinaryTransform(url: string, transform: string) {
  if (!url || !isCloudinaryUrl(url)) return url;
  const marker = "/upload/";
  const [prefix, rest] = url.split(marker);
  return `${prefix}${marker}${transform}/${rest}`;
}

const LB_1600 = "f_auto,q_auto:best,dpr_auto,w_1600,c_limit";
const LB_2400 = "f_auto,q_auto:best,dpr_auto,w_2400,c_limit";
const LB_3200 = "f_auto,q_auto:best,dpr_auto,w_3200,c_limit";
const LB_4096 = "f_auto,q_auto:best,dpr_auto,w_4096,c_limit";

export function LightboxGallery({ images, className }: LightboxGalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const slides: Slide[] = useMemo(
    () =>
      images.map((image) => {
        // Ensure we always start from the original asset.
        const base = cloudinaryBaseUrl(image.full);

        // Always use a very large image for the lightbox; this is what fixes pixelation on zoom.
        const hiRes = withCloudinaryTransform(base, LB_4096);

        return {
          src: hiRes,
          alt: image.alt,
          download: base,
        };
      }),
    [images]
  );

  return (
    <>
      <div className={className}>
        {images.map((img, i) => {
          const downloadUrl = cloudinaryBaseUrl(img.full);

          return (
            <div
              key={`${img.thumb}-${i}`}
              className="group relative overflow-hidden rounded-lg border"
            >
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => {
                  setIndex(i);
                  setOpen(true);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.thumb}
                  alt={img.alt ?? `Image ${i + 1}`}
                  className="h-40 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  loading="lazy"
                />

                <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                    View
                  </div>
                </div>
              </button>

              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                Download
              </a>
            </div>
          );
        })}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides as any}
        plugins={[Zoom, Fullscreen, Download]}
        carousel={{
          finite: false,
          padding: 0,
          spacing: 0,
          imageFit: "contain",
        }}
        styles={{
          container: { backgroundColor: "rgba(0,0,0,0.95)" },
          // Remove default paddings so fullscreen feels actually fullscreen.
          root: {
            "--yarl__carousel_padding": "0px",
            "--yarl__slide_padding": "0px",
          } as any,
        }}
        controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
        on={{ view: ({ index: viewIndex }) => setIndex(viewIndex) }}
        zoom={{
          // allow more zoom, but still bounded by real pixels.
          maxZoomPixelRatio: 8,
          zoomInMultiplier: 1.25,
          doubleTapDelay: 250,
          doubleClickDelay: 250,
        }}
      />
    </>
  );
}
