## Problema
Na toolbar do PDV (busca + 7 botões de ação), o uso de `flex-1` em todos os itens dentro de um `flex-wrap` faz com que, ao quebrar linha em larguras intermediárias, os botões estiquem até 100% da largura da nova linha, ficando "um em cima do outro" (cada botão ocupa uma linha inteira ou fica desproporcional).

## Solução
1. **Alterar layout da toolbar** em `src/routes/_authenticated/pdv.tsx`:
   - A barra de busca permanece como bloco de largura total no topo (remover `flex-1 basis-full` da div de busca dentro do flex).
   - Os 7 botões de ação saem do `flex-wrap` compartilhado e passam para um grid responsivo (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7` ou similar) abaixo da busca.
   - Remover `flex-1` dos botões; usar `w-full` no grid para preencher células, mas sem esticar além do necessário quando há quebra.
   - Ajustar `min-w` e tamanhos de texto para não haver overflow horizontal em larguras a partir de ~768px.

2. **Verificar** se a página continua sem scroll horizontal em 1024px e 1280px (com e sem sidebar).

## Arquivo
- `src/routes/_authenticated/pdv.tsx` (toolbar na seção de produtos, linhas ~945–994)