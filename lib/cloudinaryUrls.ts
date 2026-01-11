// lib/cloudinaryUrls.ts
export function withCloudinaryTransform(url: string, transform: string) {
  if (!url) return url;
  if (!url.includes("/upload/")) return url;

  const [prefix, rest] = url.split("/upload/");
  // evita doppio transform se già presente
  if (rest.startsWith(transform + "/")) return url;

  return `${prefix}/upload/${transform}/${rest}`;
}

export function cdnThumb(url: string) {
  // thumb pulita e leggera per la griglia
  return withCloudinaryTransform(url, "f_auto,q_auto,w_640,c_fill,g_auto");
}

export function cdnLightbox(url: string) {
  // hi-res per fullscreen/zoom
  return withCloudinaryTransform(url, "f_auto,q_auto:best,dpr_auto,w_2400,c_limit");
}
