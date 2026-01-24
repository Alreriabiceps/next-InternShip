/**
 * Client-safe helper. Returns a Cloudinary URL optimized for display at w×h (2x for retina).
 * Use for profile pictures so they render sharp and fit the container.
 * No cloudinary SDK dependency — pure URL string transform.
 */
export function cloudinaryThumbnail(
  url: string | null | undefined,
  w: number,
  h: number
): string {
  if (!url?.includes('res.cloudinary.com')) return url ?? '';
  const match = url.match(/^(.+\/upload\/)(v\d+\/.+)$/);
  if (!match) return url;
  const [, prefix, rest] = match;
  const transform = `w_${w * 2},h_${h * 2},c_fill,g_face,q_auto,f_auto`;
  return `${prefix}${transform}/${rest}`;
}
