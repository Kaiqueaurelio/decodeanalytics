# Sistema de PDV (Ponto de Venda) - Alcateia's Produções Gráficas

## 📋 Visão Geral

O sistema de PDV foi desenvolvido para gerenciar vendas de balcão, permitindo criar vendas rápidas, adicionar itens, gerenciar formas de pagamento e gerar relatórios detalhados. O sistema está totalmente integrado com o caixa existente, sincronizando automaticamente as vendas finalizadas.

## 🎯 Funcionalidades Principais

### 1. **Tela de Venda (PDV)**
- **Criar nova venda** com número de comanda automático ou personalizado
- **Adicionar itens** com:
  - Descrição do produto/serviço
  - Quantidade e valor unitário
  - Seleção rápida de serviços do catálogo
  - Observações adicionais
- **Gerenciar itens** com remoção individual
- **Visualizar resumo** com:
  - Total de itens
  - Subtotal
  - Desconto aplicado
  - Total final
- **Finalizar venda** com:
  - Seleção de forma de pagamento
  - Valor recebido
  - Cálculo automático de troco
  - Observações
- **Cancelar venda** com confirmação

### 2. **Gerenciamento de Vendas**
- **Vendas Abertas**: Visualizar todas as vendas em andamento
- **Vendas Finalizadas**: Histórico completo de vendas realizadas
- **Status**: Aberta, Finalizada ou Cancelada

### 3. **Relatórios e Análises**
- **KPIs principais**:
  - Total de vendas (período)
  - Quantidade de vendas
  - Ticket médio
  - Total de descontos
- **Gráficos**:
  - Vendas por dia (linha)
  - Formas de pagamento (pizza)
- **Tabelas detalhadas**:
  - Resumo por forma de pagamento
  - Detalhes de cada venda
- **Filtros**:
  - Por período (data de/até)
  - Por forma de pagamento

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

#### `pdv_sales` - Vendas
```sql
- id (UUID, PK)
- comanda_number (INTEGER) - Número da comanda
- client_id (UUID, FK) - Cliente (opcional)
- status (ENUM) - aberta, finalizada, cancelada
- subtotal (NUMERIC) - Soma dos itens
- discount (NUMERIC) - Desconto aplicado
- total (NUMERIC) - Total final
- payment_method (TEXT) - Forma de pagamento
- paid_amount (NUMERIC) - Valor recebido
- notes (TEXT) - Observações
- created_at (TIMESTAMP)
- created_by (UUID, FK) - Usuário que criou
- finalized_at (TIMESTAMP) - Data de finalização
- finalized_by (UUID, FK) - Usuário que finalizou
- updated_at (TIMESTAMP)
```

#### `pdv_sale_items` - Itens de Venda
```sql
- id (UUID, PK)
- sale_id (UUID, FK) - Referência à venda
- service_id (UUID, FK) - Serviço (opcional)
- description (TEXT) - Descrição do item
- quantity (NUMERIC) - Quantidade
- unit_price (NUMERIC) - Valor unitário
- subtotal (NUMERIC) - Subtotal do item
- notes (TEXT) - Observações
- created_at (TIMESTAMP)
```

#### `pdv_comandas` - Comandas/Mesas
```sql
- id (UUID, PK)
- number (INTEGER, UNIQUE) - Número da comanda
- name (TEXT) - Nome/identificação
- status (ENUM) - aberta, fechada, cancelada
- current_sale_id (UUID, FK) - Venda atual
- total_sales (NUMERIC) - Total de vendas acumuladas
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `pdv_payments` - Histórico de Pagamentos
```sql
- id (UUID, PK)
- sale_id (UUID, FK) - Referência à venda
- amount (NUMERIC) - Valor do pagamento
- payment_method (TEXT) - Forma de pagamento
- reference (TEXT) - Referência (NSU, etc)
- notes (TEXT) - Observações
- created_at (TIMESTAMP)
- created_by (UUID, FK) - Usuário que registrou
```

## 🔐 Segurança e Permissões

### Roles Permitidos
- **Administrador**: Acesso total
- **Financeiro**: Acesso total ao PDV e relatórios
- **Vendedor**: Acesso ao PDV (criar/editar vendas)

### Políticas RLS (Row Level Security)
- Leitura: Apenas admin, financeiro e vendedor
- Inserção: Apenas admin, financeiro e vendedor
- Atualização: Apenas admin, financeiro e vendedor
- Deleção: Apenas admin e financeiro

## 🔄 Integração com Caixa

### Sincronização Automática
Quando uma venda é **finalizada**, um lançamento é criado automaticamente no caixa:
- **Tipo**: Entrada
- **Descrição**: "Venda PDV - Comanda #[número]"
- **Valor**: Total da venda
- **Categoria**: "Venda de serviço"
- **Forma de pagamento**: Conforme selecionado

Quando uma venda é **cancelada**, um lançamento de saída é criado para reverter.

### Triggers
- `trigger_sync_pdv_sale_to_cash`: Sincroniza venda com caixa
- `trigger_update_pdv_sale_totals`: Atualiza totais quando itens são adicionados/removidos

## 📱 Rotas e Componentes

### Rotas
- `/pdv` - Tela principal de vendas
- `/pdv-reports` - Relatórios e análises

### Componentes
- `PDVPage` - Componente principal com abas de venda, abertas e finalizadas
- `PDVReportsPage` - Componente de relatórios com gráficos e análises

## 🚀 Como Usar

### Criar uma Nova Venda
1. Acesse a aba **PDV** no menu
2. Clique em **"Nova Venda"**
3. Opcionalmente, defina o número da comanda
4. Clique em **"Criar"**

### Adicionar Itens
1. Preencha a **Descrição** do produto/serviço
2. Defina a **Quantidade** (padrão: 1)
3. Defina o **Valor Unitário**
4. Opcionalmente, selecione um **Serviço** do catálogo
5. Adicione **Observações** se necessário
6. Clique em **"Adicionar Item"**

### Finalizar Venda
1. Revise os itens e o total
2. Clique em **"Finalizar"**
3. Selecione a **Forma de Pagamento**
4. Insira o **Valor Recebido**
5. O sistema calcula automaticamente o **Troco**
6. Clique em **"Confirmar"**

### Visualizar Relatórios
1. Acesse a aba **"Relatórios PDV"** no menu
2. Defina o **Período** (data de/até)
3. Opcionalmente, filtre por **Forma de Pagamento**
4. Visualize os **KPIs**, **Gráficos** e **Tabelas**

## 📊 Métricas Disponíveis

### KPIs
- **Total de Vendas**: Soma de todos os totais no período
- **Quantidade**: Número de vendas realizadas
- **Ticket Médio**: Total / Quantidade
- **Descontos**: Soma de todos os descontos

### Gráficos
- **Vendas por Dia**: Evolução diária com linha de tendência
- **Formas de Pagamento**: Distribuição percentual

### Tabelas
- **Resumo por Forma de Pagamento**: Quantidade, total e percentual
- **Detalhes das Vendas**: Comanda, data, forma, desconto e total

## 🔧 Configuração Inicial

### 1. Aplicar Migração
```bash
npx supabase migration up
```

### 2. Criar Comandas (Opcional)
Se desejar comandas pré-configuradas:
```sql
INSERT INTO pdv_comandas (number, name) VALUES
(1, 'Mesa 1'),
(2, 'Mesa 2'),
(3, 'Balcão');
```

### 3. Atribuir Roles
Certifique-se de que os usuários têm os roles corretos:
- Admin: `administrador`
- Vendedor: `vendedor`
- Financeiro: `financeiro`

## 📝 Notas Importantes

1. **Sincronização com Caixa**: Vendas canceladas geram lançamentos de saída para reverter
2. **Totais Automáticos**: Os totais são calculados automaticamente via triggers
3. **Histórico**: Todas as vendas são registradas com data e usuário
4. **Formas de Pagamento**: Dinheiro, Pix, Cartão de débito, Cartão de crédito, Boleto, Outro
5. **Relatórios**: Disponíveis apenas para admin e financeiro

## 🐛 Troubleshooting

### Venda não aparece no caixa
- Verifique se a venda foi **finalizada** (não apenas criada)
- Verifique se o trigger `trigger_sync_pdv_sale_to_cash` está ativo
- Consulte os logs do Supabase

### Totais não atualizam
- Verifique se o trigger `trigger_update_pdv_sale_totals` está ativo
- Tente recarregar a página

### Permissão negada
- Verifique se o usuário tem o role correto
- Consulte as políticas RLS na tabela

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação do Supabase: https://supabase.com/docs
- Código-fonte: `/src/routes/_authenticated/pdv.tsx`
- Migrations: `/supabase/migrations/20260614120000_pdv_system.sql`
