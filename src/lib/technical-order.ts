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
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function nonNegativeNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(1_000_000_000, Math.max(0, parsed)) : fallback;
}

function money(value: unknown): number {
  return Math.round((nonNegativeNumber(value) + Number.EPSILON) * 100) / 100;
}

function safeQuantity(value: unknown): number {
  if (value === undefined || value === null || value === "") return 1;
  return nonNegativeNumber(value);
}

export function readTechnicalData(value: unknown): TechnicalData {
  const source = isRecord(value) ? value : {};
  const services = Array.isArray(source.services)
    ? source.services.filter(isRecord).map((item, index) => ({
        id: typeof item.id === "string" && item.id.trim() ? item.id : `service-${index + 1}`,
        description: typeof item.description === "string" ? item.description : "",
        quantity: safeQuantity(item.quantity),
        unit_price: money(item.unit_price),
      }))
    : [];
  const parts = Array.isArray(source.parts)
    ? source.parts.filter(isRecord).map((item, index) => ({
        id: typeof item.id === "string" && item.id.trim() ? item.id : `part-${index + 1}`,
        name: typeof item.name === "string" ? item.name : "",
        brand: typeof item.brand === "string" ? item.brand : "",
        model: typeof item.model === "string" ? item.model : "",
        quantity: safeQuantity(item.quantity),
        cost_price: money(item.cost_price),
        sale_price: money(item.sale_price),
      }))
    : [];
  const rawInspection = isRecord(source.inspection) ? source.inspection : {};
  const inspection = Object.fromEntries(
    Object.entries(rawInspection).filter((entry): entry is [string, InspectionAnswer] =>
      entry[1] === "sim" || entry[1] === "nao" || entry[1] === "na"
    )
  );
  const approvalStatuses = ["nao_solicitado", "aguardando", "aprovado", "recusado"] as const;
  const approvalStatus = approvalStatuses.includes(source.approval_status as (typeof approvalStatuses)[number])
    ? source.approval_status as TechnicalData["approval_status"]
    : "nao_solicitado";

  return {
    ...source,
    equipment: typeof source.equipment === "string" ? source.equipment : "",
    brand: typeof source.brand === "string" ? source.brand : "",
    model: typeof source.model === "string" ? source.model : "",
    serial: typeof source.serial === "string" ? source.serial : "",
    unlock_mode: source.unlock_mode === "padrao" ? "padrao" : "senha",
    password: typeof source.password === "string" ? source.password : "",
    pattern: Array.isArray(source.pattern)
      ? [...new Set(source.pattern.filter((point): point is number =>
          typeof point === "number" && Number.isInteger(point) && point >= 1 && point <= 9
        ))]
      : [],
    complaint: typeof source.complaint === "string" ? source.complaint : "",
    accessories: typeof source.accessories === "string" ? source.accessories : "",
    color: typeof source.color === "string" ? source.color : "",
    carriers: Array.isArray(source.carriers)
      ? source.carriers.filter((carrier): carrier is string => typeof carrier === "string")
      : [],
    inspection,
    inspection_notes: typeof source.inspection_notes === "string" ? source.inspection_notes : "",
    diagnosis: typeof source.diagnosis === "string" ? source.diagnosis : "",
    resolution: typeof source.resolution === "string" ? source.resolution : "",
    warranty_days: Math.floor(nonNegativeNumber(source.warranty_days)),
    terms: typeof source.terms === "string" ? source.terms : "",
    attendant_id: typeof source.attendant_id === "string" ? source.attendant_id : "",
    technical_status: typeof source.technical_status === "string" ? source.technical_status : "aguardando_avaliacao",
    services,
    parts,
    discount: money(source.discount),
    additional_expenses: money(source.additional_expenses),
    approval_status: approvalStatus,
    approval_contact: typeof source.approval_contact === "string" ? source.approval_contact : "",
    approval_date: typeof source.approval_date === "string" ? source.approval_date : "",
    approval_notes: typeof source.approval_notes === "string" ? source.approval_notes : "",
    completion_notes: typeof source.completion_notes === "string" ? source.completion_notes : "",
    completed_at: typeof source.completed_at === "string" ? source.completed_at : "",
  };
}
export function visibleInspection(data: TechnicalData) {
  const stop = data.inspection['liga'] === 'nao';
  const noImage = data.inspection['imagem'] === 'nao';
  return inspectionQuestions.filter((q, index) => (!stop || index <= 7) && (!noImage || index <= 8));
}
export function maintenanceValidationErrors(data: TechnicalData): string[] {
  const errors: string[] = [];
  const services = Array.isArray(data.services) ? data.services : [];
  const parts = Array.isArray(data.parts) ? data.parts : [];
  if (services.some(item =>
    nonNegativeNumber(item?.unit_price) > 0 &&
    !(typeof item?.description === "string" && item.description.trim())
  )) {
    errors.push("Descreva cada serviço que possui valor cobrado.");
  }
  if (parts.some(item =>
    (nonNegativeNumber(item?.sale_price) > 0 || nonNegativeNumber(item?.cost_price) > 0) &&
    !(typeof item?.name === "string" && item.name.trim())
  )) {
    errors.push("Informe o nome de cada peça que possui custo ou valor de venda.");
  }
  return errors;
}
export function maintenanceTotals(data: TechnicalData) {
  const services = money((Array.isArray(data.services) ? data.services : []).reduce((sum, item) => {
    if (!item || typeof item.description !== "string" || !item.description.trim()) return sum;
    return sum + money(safeQuantity(item.quantity) * money(item.unit_price));
  }, 0));
  const parts = money((Array.isArray(data.parts) ? data.parts : []).reduce((sum, item) => {
    if (!item || typeof item.name !== "string" || !item.name.trim()) return sum;
    return sum + money(safeQuantity(item.quantity) * money(item.sale_price));
  }, 0));
  const additional = money(data.additional_expenses);
  const gross = money(services + parts + additional);
  const discount = money(Math.min(gross, nonNegativeNumber(data.discount)));
  return { services, parts, additional, discount, total: money(Math.max(0, gross - discount)) };
}
export function technicalOrderItems(data: TechnicalData) {
  const services = (Array.isArray(data.services) ? data.services : [])
    .filter(item => typeof item?.description === "string" && item.description.trim())
    .map(item => {
      const quantity = safeQuantity(item.quantity);
      const unitPrice = money(item.unit_price);
      return {
        description: item.description.trim(),
        quantity,
        unit_price: unitPrice,
        subtotal: money(quantity * unitPrice),
        service_id: null,
      };
    });
  const parts = (Array.isArray(data.parts) ? data.parts : [])
    .filter(item => typeof item?.name === "string" && item.name.trim())
    .map(item => {
      const quantity = safeQuantity(item.quantity);
      const unitPrice = money(item.sale_price);
      return {
        description: `Peça: ${item.name.trim()}${item.brand ? ` · ${item.brand}` : ""}${item.model ? ` · ${item.model}` : ""}`,
        quantity,
        unit_price: unitPrice,
        subtotal: money(quantity * unitPrice),
        service_id: null,
      };
    });
  const additional = money(data.additional_expenses);
  return [
    ...services,
    ...parts,
    ...(additional > 0 ? [{
      description: "Despesas adicionais",
      quantity: 1,
      unit_price: additional,
      subtotal: additional,
      service_id: null,
    }] : []),
  ];
}
export function customerTechnicalRows(data: TechnicalData): string[][] {
  const safe = readTechnicalData(data);
  const totals = maintenanceTotals(safe);
  const parts = safe.parts.filter(p => p.name.trim()).map(p => [
    `Peça substituída: ${p.name}`,
    [p.brand, p.model, `Quantidade: ${p.quantity}`].filter(Boolean).join(" · "),
  ]);
  const services = safe.services.filter(s => s.description.trim()).map(s => [
    "Serviço realizado", `${s.description} · Quantidade: ${s.quantity}`,
  ]);
  const technicalStatus = ({
    aguardando_avaliacao: "Aguardando avaliação",
    em_diagnostico: "Em diagnóstico",
    aguardando_aprovacao: "Aguardando aprovação",
    aguardando_pecas: "Aguardando peças",
    em_reparo: "Em reparo",
    pronto: "Pronto para retirada",
  })[safe.technical_status] || "Não informado";
  const approval = ({
    nao_solicitado: "Não solicitado",
    aguardando: "Aguardando aprovação",
    aprovado: "Aprovado",
    recusado: "Recusado",
  })[safe.approval_status] || "Não informado";
  return [
    ["Equipamento", [safe.equipment, safe.brand, safe.model].filter(Boolean).join(" · ")],
    ["Série / IMEI", safe.serial], ["Cor", safe.color], ["Defeito relatado", safe.complaint],
    ["Acessórios entregues", safe.accessories], ["Operadoras / memória", safe.carriers.join(", ")],
    ["Status técnico", technicalStatus],
    ["Concluído em", safe.completed_at ? new Date(safe.completed_at).toLocaleString("pt-BR") : ""],
    ["Diagnóstico", safe.diagnosis], ["Solução / reparo", safe.resolution],
    ["Garantia", `${safe.warranty_days} dias`], ["Termos acordados", safe.terms],
    ["Aprovação do orçamento", approval],
    ["Aprovado por", safe.approval_contact],
    ["Data da aprovação", safe.approval_date ? new Date(safe.approval_date).toLocaleString("pt-BR") : ""],
    ["Observações da aprovação", safe.approval_notes],
    ...services, ...parts,
    ["Observações de conclusão", safe.completion_notes],
    ["Valor dos serviços", totals.services.toLocaleString("pt-BR", {style:"currency",currency:"BRL"})],
    ["Valor das peças", totals.parts.toLocaleString("pt-BR", {style:"currency",currency:"BRL"})],
    ["Despesas adicionais", totals.additional.toLocaleString("pt-BR", {style:"currency",currency:"BRL"})],
    ["Desconto", totals.discount.toLocaleString("pt-BR", {style:"currency",currency:"BRL"})],
    ...visibleInspection(safe).map(q => [q.title, ({sim:"Sim", nao:"Não", na:"Não testado"})[safe.inspection[q.id]] || "Não respondido"]),
    ["Condição de entrada", safe.inspection_notes],
  ].filter(row => row[1]);
}
