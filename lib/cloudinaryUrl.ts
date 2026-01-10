export function cloudinaryTransform(url: string, transform: string) {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}
