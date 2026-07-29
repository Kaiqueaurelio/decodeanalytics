# Alcateia Print Hub

Crie um sistema web completo e funcional para gestão de gráfica chamado Alcateia Gestão.



Objetivo:

O sistema deve controlar clientes, ordens de serviço, caixa, projetos, pagamentos, arquivos, serviços vendidos, relatórios e status de produção de uma gráfica.



Tecnologias:

- React

- Supabase Auth

- Supabase Database

- Supabase Storage

- Design responsivo

- Tema azul-marinho, dourado e branco

- Interface moderna, limpa e profissional



MÓDULOS DO SISTEMA



1. LOGIN E USUÁRIOS



Criar autenticação com:

- e-mail e senha

- recuperação de senha

- logout

- proteção de rotas



Tipos de usuário:

- administrador

- atendente

- produção

- financeiro



Permissões:

Administrador acessa tudo.

Atendente acessa clientes, orçamentos e ordens de serviço.

Produção acessa apenas ordens aprovadas e em produção.

Financeiro acessa caixa, pagamentos e relatórios.



2. DASHBOARD



Criar painel inicial com cards:

- saldo atual

- entradas do dia

- saídas do dia

- faturamento do mês

- contas a receber

- contas pagas

- ordens em andamento

- ordens atrasadas

- pedidos aguardando arte

- pedidos prontos para retirada



Criar gráficos simples:

- faturamento dos últimos 7 dias

- serviços mais vendidos

- status das ordens de serviço



3. CLIENTES



Criar CRUD completo de clientes:

- cadastrar

- editar

- excluir

- pesquisar

- visualizar histórico



Campos:

- nome ou empresa

- CPF/CNPJ

- WhatsApp

- e-mail

- endereço

- bairro

- cidade

- observações

- data de cadastro



Na tela do cliente mostrar:

- dados do cliente

- histórico de ordens

- valores pagos

- valores pendentes

- arquivos relacionados



4. SERVIÇOS E PRODUTOS



Criar cadastro de serviços:

- nome do serviço

- categoria

- descrição

- preço base

- unidade de medida

- prazo padrão

- ativo/inativo



Categorias iniciais:

- banners acadêmicos

- banners personalizados

- adesivos

- adesivos para vidro

- cartões de visita

- canecas personalizadas

- DTF

- camisetas

- placas

- sinalização

- impressão 3D

- impressões grandes

- personalizados

- outros



5. ORÇAMENTOS



Criar tela para gerar orçamento antes da OS.



Campos:

- cliente

- serviços adicionados

- descrição

- quantidade

- valor unitário

- desconto

- valor total

- validade do orçamento

- observações

- status: em análise, enviado, aprovado, recusado



Ao aprovar orçamento, permitir gerar uma ordem de serviço automaticamente.



Permitir exportar orçamento em PDF.



6. ORDEM DE SERVIÇO



Criar CRUD completo de OS.



Campos:

- número automático da OS

- cliente vinculado

- data de criação

- prazo de entrega

- responsável pelo atendimento

- serviço

- categoria

- descrição detalhada

- medidas

- quantidade

- material

- acabamento

- observações do cliente

- observações internas

- arquivos anexados

- valor total

- entrada/sinal

- valor restante

- forma de pagamento

- status do pagamento

- status da produção



Status de produção:

- orçamento

- aguardando aprovação

- aguardando arte

- arte em criação

- aguardando pagamento

- aprovado

- em produção

- pausado

- pronto para retirada

- entregue

- cancelado



Status de pagamento:

- não pago

- sinal pago

- pago parcial

- pago completo

- em atraso



A OS deve permitir:

- anexar imagens, PDFs e referências

- gerar PDF

- imprimir

- duplicar OS

- alterar status

- registrar histórico de alterações

- adicionar comentários internos

- marcar como urgente

- marcar prazo atrasado automaticamente



7. KANBAN DE PRODUÇÃO



Criar tela Kanban com colunas:

- aguardando arte

- arte em criação

- aguardando aprovação

- aprovado

- em produção

- pronto para retirada

- entregue



Cada card deve mostrar:

- número da OS

- cliente

- serviço

- prazo

- valor

- status de pagamento

- etiqueta de urgência

- miniatura do anexo, se houver



Permitir arrastar cards entre colunas e atualizar o status automaticamente.



8. CAIXA E FINANCEIRO



Criar módulo financeiro completo.



Lançamentos:

- entrada

- saída



Campos:

- tipo

- descrição

- categoria

- valor

- data

- forma de pagamento

- cliente vinculado

- OS vinculada

- comprovante/anexo

- observações



Categorias de entrada:

- venda de serviço

- pagamento de OS

- sinal/entrada

- outros



Categorias de saída:

- material

- aluguel

- energia

- internet

- funcionário

- fornecedor

- manutenção

- equipamento

- transporte

- outros



Formas de pagamento:

- dinheiro

- Pix

- cartão de débito

- cartão de crédito

- boleto

- transferência

- outro



Tela financeira deve mostrar:

- saldo atual

- entradas

- saídas

- lucro estimado

- contas a receber

- contas pagas

- contas vencidas

- filtro por data

- filtro por forma de pagamento

- filtro por categoria



9. CONTAS A RECEBER



Criar módulo de contas a receber.



Campos:

- cliente

- OS

- valor

- vencimento

- status

- forma de pagamento prevista

- observações



Status:

- pendente

- pago

- vencido

- cancelado



Quando uma OS tiver valor restante, criar conta a receber automaticamente.



10. ARQUIVOS



Usar Supabase Storage para:

- arquivos de clientes

- artes

- referências

- comprovantes

- PDFs de orçamento

- PDFs de OS



Permitir:

- upload

- visualização

- download

- exclusão

- associação com cliente, orçamento ou OS



11. RELATÓRIOS



Criar relatórios com filtros por período:

- faturamento diário

- faturamento mensal

- entradas e saídas

- lucro estimado

- serviços mais vendidos

- clientes que mais compraram

- OS por status

- contas vencidas

- formas de pagamento mais usadas

- ticket médio



Mostrar cards e gráficos simples.



Permitir exportar relatório em PDF ou CSV.



12. NOTIFICAÇÕES INTERNAS



Criar alertas no sistema para:

- OS atrasada

- conta vencida

- pedido pronto para retirada

- pedido aguardando arte

- pagamento pendente

- prazo de entrega próximo



13. CONFIGURAÇÕES



Criar tela de configurações com:

- dados da empresa

- logo

- WhatsApp

- Instagram

- endereço

- CNPJ

- texto padrão do orçamento

- texto padrão da OS

- prazo padrão

- categorias

- usuários e permissões



Dados iniciais da empresa:

Nome: Alcateia's Produções Gráficas

WhatsApp: (11) 97223-5342

Instagram: @alcateiasproducoesgraficas

Endereço: Galeria Vila Marcondes



14. PDF DA ORDEM DE SERVIÇO



Gerar PDF profissional com:

- logo da empresa

- dados da empresa

- número da OS

- dados do cliente

- descrição do serviço

- quantidade

- valor total

- entrada

- valor restante

- prazo

- status

- observações

- campo de assinatura

- data



15. PDF DO ORÇAMENTO



Gerar PDF com:

- logo da empresa

- dados da empresa

- dados do cliente

- itens do orçamento

- valores

- validade

- observações

- CTA para aprovação



16. REGRAS IMPORTANTES



- Toda OS deve ter número automático.

- Toda movimentação financeira deve ser registrada.

- Ao receber pagamento, atualizar status financeiro da OS.

- Ao criar OS com valor restante, gerar conta a receber.

- Ao marcar conta como paga, criar entrada no caixa.

- Ao atrasar prazo de OS, marcar como atrasada.

- Não permitir excluir OS sem confirmação.

- Não permitir excluir cliente com OS vinculada sem aviso.

- Interface deve ser simples para uso em balcão de atendimento.



17. DESIGN



Visual:

- fundo claro

- azul-marinho como cor principal

- dourado como destaque

- branco para cards

- bordas arredondadas

- dashboard com cards

- tabelas limpas

- botões claros

- layout responsivo para computador, tablet e celular



Criar menu lateral com:

- Dashboard

- Clientes

- Orçamentos

- Ordens de Serviço

- Produção

- Caixa

- Contas a Receber

- Serviços

- Arquivos

- Relatórios

- Configurações



O sistema deve ser entregue funcional, com banco Supabase configurado, tabelas criadas, relacionamentos entre clientes, orçamentos, OS, caixa e contas a receber, autenticação ativa e interface pronta para uso.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://alcateiaproducoesgraficas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ebe87853-f70e-45ca-8c52-709e6f8f5774).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
