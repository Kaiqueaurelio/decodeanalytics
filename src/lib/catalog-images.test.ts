import { describe, expect, it } from "vitest";
import { imagePathFor, inferCatalogCategory } from "./catalog-images";

describe("catalog product image defaults", () => {
  it.each([
    ["Cartões", "Cartão de visita", "/products/cartoes.jpg"],
    ["Panfletos", "Panfleto A5", "/products/panfletos.jpg"],
    ["Adesivos", "Adesivo vinil", "/products/adesivos.jpg"],
    ["Banners", "Banner em lona", "/products/banners.jpg"],
    ["Canecas", "Caneca personalizada", "/products/canecas.jpg"],
    ["Camisetas", "Camiseta personalizada", "/products/camisetas.jpg"],
    ["Brindes", "Squeeze personalizado", "/products/brindes.jpg"],
    ["Embalagens", "Caixa delivery", "/products/embalagens.jpg"],
    ["Plotagem", "Plotagem A3", "/products/plotagem.jpg"],
  ])("maps %s products to an existing JPG asset", (category, name, expected) => {
    expect(imagePathFor(category, name)).toBe(expected);
    expect(expected.endsWith(".jpg")).toBe(true);
  });

  it("infers categories from product names when the supplied category is generic", () => {
    expect(inferCatalogCategory("Banner lona personalizada", "Outros")).toBe("Banners");
    expect(inferCatalogCategory("Squeeze personalizado", "Outros")).toBe("Brindes");
  });

  it("does not invent a path for an unsupported category", () => {
    expect(imagePathFor("Outros", "Software sob medida")).toBeNull();
  });
});
