/**
 * Do not substitute stock photos for real catalogue products.
 * A product image is displayed only when it comes from the product record.
 * This avoids showing unrelated generic images as if they were offered items.
 */
export const CATEGORY_IMAGES: Record<string, string> = {};

export function resolveProductImage(
  imageUrl: string | null | undefined,
  _category: string | null | undefined,
  _slug?: string | null,
): string | undefined {
  if (imageUrl?.startsWith("https://") || imageUrl?.startsWith("http://")) return imageUrl;
  if (imageUrl?.startsWith("/") || imageUrl?.startsWith("data:")) return imageUrl;
  return undefined;
}
