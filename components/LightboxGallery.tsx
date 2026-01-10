"use client";

import { useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

type Slide = { src: string; alt?: string };

type LightboxGalleryProps = {
  images: { thumb: string; full: string; alt?: string }[];
  className?: string;
};

export function LightboxGallery({
  images,
  className,
}: LightboxGalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const slides: Slide[] = useMemo(
    () => images.map((image) => ({ src: image.full, alt: image.alt })),
    [images]
  );

  return (
    <>
      <div className={className}>
        {images.map((img, i) => (
          <button
            key={`${img.thumb}-${i}`}
            type="button"
            className="group relative overflow-hidden rounded-lg border text-left"
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
        ))}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        plugins={[Zoom]}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
        on={{ view: ({ index: viewIndex }) => setIndex(viewIndex) }}
        zoom={{
          maxZoomPixelRatio: 4,
          zoomInMultiplier: 1.2,
          doubleTapDelay: 250,
          doubleClickDelay: 250,
        }}
      />
    </>
  );
}
