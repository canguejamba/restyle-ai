export type RoomType =
  | "Living Room"
  | "Bedroom"
  | "Kitchen"
  | "Bathroom"
  | "Dining Room"
  | "Home Office";

export type Style =
  | "Modern Minimal"
  | "Scandinavian"
  | "Japandi"
  | "Industrial"
  | "Contemporary Luxury"
  | "Warm Mediterranean";

export const ROOM_TYPES: { title: RoomType; desc: string }[] = [
  { title: "Living Room", desc: "Cozy, inviting, and balanced." },
  { title: "Bedroom", desc: "Calm, warm, and restful." },
  { title: "Kitchen", desc: "Clean, functional, and bright." },
  { title: "Bathroom", desc: "Fresh, modern, and spa-like." },
  { title: "Dining Room", desc: "Elegant, social, and well-lit." },
  { title: "Home Office", desc: "Focused, minimal, and productive." },
];

export const STYLES: { title: Style; vibe: string }[] = [
  { title: "Modern Minimal", vibe: "Clean lines, less clutter." },
  { title: "Scandinavian", vibe: "Light woods, airy tones." },
  { title: "Japandi", vibe: "Zen + warmth, refined." },
  { title: "Industrial", vibe: "Concrete, metal, bold." },
  { title: "Contemporary Luxury", vibe: "High-end, polished." },
  { title: "Warm Mediterranean", vibe: "Sun-kissed, textured." },
];

export type Intensity = "low" | "medium" | "high";

export const INTENSITY: { id: Intensity; label: string; hint: string }[] = [
  { id: "low", label: "Low", hint: "Most faithful to the original room." },
  { id: "medium", label: "Medium", hint: "Balanced change and fidelity." },
  { id: "high", label: "High", hint: "More creative / wow factor." },
];
