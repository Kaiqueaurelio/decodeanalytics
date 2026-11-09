import { describe, expect, it } from "vitest";
import { resolveProductFallbackImage, resolveProductImage } from "./productImages";
import { resolveSmartImageSrc } from "./SmartImage";

describe("resolveProductImage", () => {
  it("uses a dedicated local photo when the database image is blank", () => {
    const image = resolveProductImage("", "Brindes", "bone-personalizado");
    expect(image).toBeTruthy();
    expect(image).not.toBe("");
  });

  it("uses a dedicated service photo when image_url is null", () => {
    const image = resolveProductImage(null, "Manutenção de Computadores", "formatacao-de-android");
    expect(image).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });

  it("replaces a legacy category image with the dedicated product image", () => {
    const image = resolveProductImage(
      "/__l5e/assets-v1/cartoes.jpg",
      "Cartões",
      "cartao-visita-couche-300g",
    );
    expect(image).toBeTruthy();
    expect(image).not.toBe("");
  });

  it("preserves a supplied remote product image", () => {
    const remote = "https://cdn.example.com/products/custom.webp";
    expect(resolveProductImage(remote, "Canecas", "caneca-personalizada")).toBe(remote);
  });

  it("uses a category photo for an unknown product instead of an empty source", () => {
    expect(resolveProductImage(null, "Social Media", "servico-novo")).toBeTruthy();
  });

  it("provides a local category photo as a secondary fallback for failed remote images", () => {
    const fallback = resolveProductFallbackImage("Manutenção de Computadores");
    expect(fallback).toBeTruthy();
    expect(fallback).not.toMatch(/^https?:\\/\\//);
  });

  it("always returns a final fallback even when the product has no metadata", () => {
    expect(resolveProductImage(null, null, null)).toBeTruthy();
  });
});

describe("resolveSmartImageSrc", () => {
  it("uses the fallback immediately when the primary URL is empty", () => {
    expect(resolveSmartImageSrc("", "/assets/fallback.jpg")).toBe("/assets/fallback.jpg");
    expect(resolveSmartImageSrc("   ", "/assets/fallback.jpg")).toBe("/assets/fallback.jpg");
  });

  it("prefers a non-empty primary URL", () => {
    expect(resolveSmartImageSrc("/assets/product.jpg", "/assets/fallback.jpg"))
      .toBe("/assets/product.jpg");
  });

  it("switches to fallback after the primary image fails", () => {
    expect(resolveSmartImageSrc("/assets/broken.jpg", "/assets/fallback.jpg", true))
      .toBe("/assets/fallback.jpg");
  });

  it("returns no source only when both URLs are absent", () => {
    expect(resolveSmartImageSrc(null, " ")).toBeUndefined();
  });
});
