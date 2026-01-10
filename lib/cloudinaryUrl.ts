const CLOUDINARY_VERSION_RE = /^v\d+$/;

export function cloudinaryTransform(url: string, transform: string) {
  const uploadMarker = "/upload/";
  if (!url.includes(uploadMarker)) return url;

  const [prefix, rest] = url.split(uploadMarker);
  if (!rest) return url;

  const segments = rest.split("/");
  const versionIndex = segments.findIndex((segment) =>
    CLOUDINARY_VERSION_RE.test(segment)
  );

  const normalizedRest =
    versionIndex === -1 ? rest : segments.slice(versionIndex).join("/");

  return `${prefix}${uploadMarker}${transform}/${normalizedRest}`;
}
