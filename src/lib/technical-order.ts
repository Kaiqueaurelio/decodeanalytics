export type InspectionAnswer = 'sim' | 'nao' | 'na';
export interface TechnicalData {
  equipment: string; brand: string; model: string; serial: string;
  unlock_mode: 'senha' | 'padrao'; password: string; pattern: number[];
  complaint: string; accessories: string; color: string; carriers: string[];
  inspection: Record<string, InspectionAnswer>; inspection_notes: string;
  photos: string[];
  diagnosis: string; resolution: string; warranty_days: number; terms: string;
  attendant_id: string; technical_status: string;
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
  return { equipment: '', brand: '', model: '', serial: '', unlock_mode: 'senha', password: '', pattern: [], complaint: '', accessories: '', color: '', carriers: [], inspection: {}, inspection_notes: '', photos: [], diagnosis: '', resolution: '', warranty_days: 0, terms: '', attendant_id: '', technical_status: 'aguardando_avaliacao' };
}
export function readTechnicalData(value: unknown): TechnicalData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyTechnicalData();
  const data = { ...emptyTechnicalData(), ...value } as TechnicalData;
  data.photos = Array.isArray(data.photos) ? data.photos.filter((path): path is string => typeof path === 'string') : [];
  return data;
}
export function visibleInspection(data: TechnicalData) {
  const stop = data.inspection['liga'] === 'nao';
  const noImage = data.inspection['imagem'] === 'nao';
  return inspectionQuestions.filter((q, index) => (!stop || index <= 7) && (!noImage || index <= 8));
}
export function customerTechnicalRows(data: TechnicalData): string[][] {
  return [ ['Equipamento', [data.equipment, data.brand, data.model].filter(Boolean).join(' · ')], ['Série / IMEI', data.serial], ['Cor', data.color], ['Defeito relatado', data.complaint], ['Acessórios entregues', data.accessories], ['Operadoras / memória', data.carriers.join(', ')], ['Diagnóstico', data.diagnosis], ['Solução / peças substituídas', data.resolution], ['Garantia', `${data.warranty_days} dias`], ['Termos acordados', data.terms], ...visibleInspection(data).map(q => [q.title, ({sim: 'Sim', nao: 'Não', na: 'Não testado'})[data.inspection[q.id]] || 'Não respondido']), ['Condição de entrada', data.inspection_notes] ].filter(row => row[1]);
}
