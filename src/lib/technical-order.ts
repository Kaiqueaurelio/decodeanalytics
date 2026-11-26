export type InspectionAnswer = 'sim' | 'nao' | 'na';
export interface MaintenanceService {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}
export interface MaintenancePart {
  id: string;
  name: string;
  brand: string;
  model: string;
  quantity: number;
  cost_price: number;
  sale_price: number;
}
export interface TechnicalData {
  equipment: string; brand: string; model: string; serial: string;
  unlock_mode: 'senha' | 'padrao'; password: string; pattern: number[];
  complaint: string; accessories: string; color: string; carriers: string[];
  inspection: Record<string, InspectionAnswer>; inspection_notes: string;
  diagnosis: string; resolution: string; warranty_days: number; terms: string;
  attendant_id: string; technical_status: string;
  services: MaintenanceService[];
  parts: MaintenancePart[];
  discount: number;
  additional_expenses: number;
  approval_status: 'nao_solicitado' | 'aguardando' | 'aprovado' | 'recusado';
  approval_contact: string;
  approval_date: string;
  approval_notes: string;
  completion_notes: string;
  completed_at: string;
}
export const inspectionQuestions = [
  { id: 'pelicula', title: 'O aparelho está com película?' },
  { id: 'capinha', title: 'Foi entregue com capa ou proteção?' },
  { id: 'carcaca', title: 'A carcaça está íntegra?' },
  { id: 'tela', title: 'A tela está íntegra?' },
  { id: 'botoes', title: 'Os botões funcionam?' },
  { id: 'conector', title: 'O conector de carga está íntegro?' },
  { id: 'chip', title: 'Há chip ou cartão de memória?' },
  { id: 'liga', title: 'O aparelho está ligando?' },
  { id: 'imagem', title: 'Está dando imagem?' },
  { id: 'toque', title: 'O toque ou teclado funciona?' },
  { id: 'audio', title: 'O áudio funciona?' },
  { id: 'camera', title: 'As câmeras funcionam?' },
  { id: 'wifi', title: 'O Wi-Fi funciona?' },
  { id: 'bateria', title: 'A bateria está carregando?' },
] as const;
export function emptyTechnicalData(): TechnicalData {
  return {
    equipment: '', brand: '', model: '', serial: '', unlock_mode: 'senha', password: '', pattern: [],
    complaint: '', accessories: '', color: '', carriers: [], inspection: {}, inspection_notes: '',
    diagnosis: '', resolution: '', warranty_days: 0, terms: '', attendant_id: '',
    technical_status: 'aguardando_avaliacao', services: [], parts: [], discount: 0,
    additional_expenses: 0, approval_status: 'nao_solicitado', approval_contact: '',
    approval_date: '', approval_notes: '', completion_notes: '', completed_at: '',
  };
}
export function readTechnicalData(value: unknown): TechnicalData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyTechnicalData();
  const source = value as Partial<TechnicalData>;
  return {
    ...emptyTechnicalData(), ...source,
    services: Array.isArray(source.services) ? source.services : [],
    parts: Array.isArray(source.parts) ? source.parts : [],
    inspection: source.inspection && typeof source.inspection === 'object' ? source.inspection : {},
    carriers: Array.isArray(source.carriers) ? source.carriers : [],
    pattern: Array.isArray(source.pattern) ? source.pattern : [],
  };
}
export function visibleInspection(data: TechnicalData) {
  const stop = data.inspection['liga'] === 'nao';
  const noImage = data.inspection['imagem'] === 'nao';
  return inspectionQuestions.filter((q, index) => (!stop || index <= 7) && (!noImage || index <= 8));
}
function nonNegativeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function maintenanceValidationErrors(data: TechnicalData): string[] {
  const errors: string[] = [];
  if (data.services.some(item => nonNegativeNumber(item.unit_price) > 0 && !item.description?.trim())) {
    errors.push('Descreva cada serviço que possui valor cobrado.');
  }
  if (data.parts.some(item =>
    (nonNegativeNumber(item.sale_price) > 0 || nonNegativeNumber(item.cost_price) > 0) && !item.name?.trim()
  )) {
    errors.push('Informe o nome de cada peça que possui custo ou valor de venda.');
  }
  return errors;
}

export function maintenanceTotals(data: TechnicalData) {
  const services = data.services.filter(item => item.description?.trim()).reduce((sum, item) => sum + nonNegativeNumber(item.quantity) * nonNegativeNumber(item.unit_price), 0);
  const parts = data.parts.filter(item => item.name?.trim()).reduce((sum, item) => sum + nonNegativeNumber(item.quantity) * nonNegativeNumber(item.sale_price), 0);
  const additional = nonNegativeNumber(data.additional_expenses);
  const discount = Math.min(services + parts + additional, nonNegativeNumber(data.discount));
  return { services, parts, additional, discount, total: Math.max(0, services + parts + additional - discount) };
}
export function technicalOrderItems(data: TechnicalData) {
  return [
    ...data.services.filter(item => item.description.trim()).map(item => ({
      description: item.description.trim(), quantity: nonNegativeNumber(item.quantity),
      unit_price: nonNegativeNumber(item.unit_price), subtotal: nonNegativeNumber(item.quantity) * nonNegativeNumber(item.unit_price),
      service_id: null,
    })),
    ...data.parts.filter(item => item.name.trim()).map(item => ({
      description: `Peça: ${item.name.trim()}${item.brand ? ` · ${item.brand}` : ''}${item.model ? ` · ${item.model}` : ''}`,
      quantity: nonNegativeNumber(item.quantity), unit_price: nonNegativeNumber(item.sale_price),
      subtotal: nonNegativeNumber(item.quantity) * nonNegativeNumber(item.sale_price), service_id: null,
    })),
    ...(Number(data.additional_expenses) > 0 ? [{
      description: 'Despesas adicionais', quantity: 1, unit_price: Number(data.additional_expenses),
      subtotal: Number(data.additional_expenses), service_id: null,
    }] : []),
  ];
}
export function customerTechnicalRows(data: TechnicalData): string[][] {
  const totals = maintenanceTotals(data);
  const parts = data.parts.filter(p => p.name.trim()).map(p => [
    `Peça substituída: ${p.name}`,
    [p.brand, p.model, `Quantidade: ${p.quantity}`].filter(Boolean).join(' · '),
  ]);
  const services = data.services.filter(s => s.description.trim()).map(s => [
    'Serviço realizado', `${s.description} · Quantidade: ${s.quantity}`,
  ]);
  const approval = ({
    nao_solicitado: 'Não solicitado',
    aguardando: 'Aguardando aprovação',
    aprovado: 'Aprovado',
    recusado: 'Recusado',
  })[data.approval_status] || 'Não informado';
  return [
    ['Equipamento', [data.equipment, data.brand, data.model].filter(Boolean).join(' · ')],
    ['Série / IMEI', data.serial], ['Cor', data.color], ['Defeito relatado', data.complaint],
    ['Acessórios entregues', data.accessories], ['Operadoras / memória', data.carriers.join(', ')],
    ['Diagnóstico', data.diagnosis], ['Solução / reparo', data.resolution],
    ['Garantia', `${data.warranty_days} dias`], ['Termos acordados', data.terms],
    ['Aprovação do orçamento', approval],
    ['Aprovado por', data.approval_contact],
    ['Data da aprovação', data.approval_date ? new Date(data.approval_date).toLocaleString('pt-BR') : ''],
    ['Observações da aprovação', data.approval_notes],
    ...services, ...parts,
    ['Observações de conclusão', data.completion_notes],
    ['Valor dos serviços', totals.services.toLocaleString('pt-BR', {style:'currency',currency:'BRL'})],
    ['Valor das peças', totals.parts.toLocaleString('pt-BR', {style:'currency',currency:'BRL'})],
    ['Despesas adicionais', totals.additional.toLocaleString('pt-BR', {style:'currency',currency:'BRL'})],
    ['Desconto', totals.discount.toLocaleString('pt-BR', {style:'currency',currency:'BRL'})],
    ...visibleInspection(data).map(q => [q.title, ({sim: 'Sim', nao: 'Não', na: 'Não testado'})[data.inspection[q.id]] || 'Não respondido']),
    ['Condição de entrada', data.inspection_notes],
  ].filter(row => row[1]);
}
