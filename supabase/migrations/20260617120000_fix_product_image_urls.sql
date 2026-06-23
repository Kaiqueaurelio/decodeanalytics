-- Corrige as URLs de imagem dos produtos para usar caminhos públicos locais
-- em vez das URLs do sistema de assets legado (/__l5e/).
-- As imagens estão disponíveis em /products/ no servidor público.

UPDATE public.services SET image_url = '/products/cartoes.jpg'    WHERE category = 'Cartões';
UPDATE public.services SET image_url = '/products/panfletos.jpg'  WHERE category = 'Panfletos';
UPDATE public.services SET image_url = '/products/adesivos.jpg'   WHERE category = 'Adesivos';
UPDATE public.services SET image_url = '/products/canecas.jpg'    WHERE category = 'Canecas';
UPDATE public.services SET image_url = '/products/camisetas.jpg'  WHERE category = 'Camisetas';
UPDATE public.services SET image_url = '/products/brindes.webp'   WHERE category = 'Brindes';
UPDATE public.services SET image_url = '/products/banners.webp'   WHERE category = 'Banners';
UPDATE public.services SET image_url = '/products/embalagens.webp' WHERE category = 'Embalagens';
UPDATE public.services SET image_url = '/products/plotagem.webp'  WHERE category = 'Plotagem';
