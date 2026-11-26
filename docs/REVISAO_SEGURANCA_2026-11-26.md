# Revisão de segurança — 26/11/2026

## Alterações preparadas no GitHub

As correções abaixo foram adicionadas diretamente à branch `main`. As migrations SQL estão versionadas no repositório, mas precisam ser aplicadas e verificadas no projeto Supabase correto antes de serem consideradas ativas em produção.

- **Ordens:** política UPDATE explicitada com `USING` e `WITH CHECK`; trigger lê o cargo canônico de `profiles.role` (em vez de depender de registros legados possivelmente desatualizados em `user_roles`) e impede que financeiro e produção alterem o total da OS ou campos fora de suas responsabilidades. Atendimento e administração preservam o fluxo operacional; financeiro pode atualizar pagamento; produção pode atualizar andamento e dados técnicos.
- **Políticas RLS:** políticas de leitura de `services` e `company_settings` limitadas a funções internas autorizadas; políticas de briefing, arquivos e versões de arte reafirmadas para perfis internos aprovados, sem acesso irrestrito a qualquer conta autenticada.
- **Storage:** removidas políticas antigas permissivas de INSERT/UPDATE/DELETE em `company-assets`; gravação e exclusão ficam restritas à administração.
- **Consulta de cargos:** helpers de verificação de papel limitados à própria identidade autenticada, evitando consultar se outro usuário é administrador.
- **Impressão de fechamento:** valores textuais provenientes do banco são escapados antes de compor o HTML de impressão, prevenindo injeção de marcação/script.
- **Ella pública:** histórico enviado pelo navegador não pode forjar mensagens com papel de assistente; chamadas têm limite de saída, limite de etapas e sem repetição automática; a base pública é delimitada como dado não confiável e o prompt reforça resistência a prompt injection.
- **Busca de conhecimento da Ella:** usuários não administradores não podem consultar o escopo interno; o termo de busca é normalizado e limitado antes de compor o filtro.

## Risco que permanece intencionalmente aberto

O bucket `company-assets` continua público porque o catálogo e os avatares atuais usam URLs públicas desse bucket. Torná-lo privado sem inventariar e migrar os objetos quebraria imagens existentes. O código revisado usa esse bucket para imagens públicas de catálogo e perfil; documentos confidenciais não devem ser armazenados nele. Para eliminar o alerta de leitura pública sem quebrar a vitrine, é necessário inventariar os objetos reais e migrar os arquivos públicos para um bucket público dedicado, deixando o bucket de documentos privado.

## Validação necessária

- Aplicar a migration `20261126090000_harden_order_access_and_storage_policies.sql` no projeto Supabase correto.
- Testar com contas de cada perfil: admin, atendimento, financeiro, produção e conta pendente.
- Confirmar que financeiro não consegue alterar `orders.total`; produção não consegue alterar `orders.total` ou `orders.paid`; e os fluxos permitidos continuam funcionando.
- Confirmar que uploads em `company-assets` falham para usuários não administradores, enquanto URLs públicas já existentes continuam carregando.
- Testar a impressão com observações contendo HTML e JavaScript como texto literal.
- Testar Ella pública com prompt injection e histórico forjado pelo navegador; confirmar limites de uso e custo.
- Reexecutar o scanner de segurança depois da migration e revisar os alertas restantes.

Nenhuma migration foi executada diretamente no banco por este trabalho.
