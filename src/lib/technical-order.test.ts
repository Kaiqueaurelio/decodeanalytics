import { describe, test, expect } from 'vitest';
import {
  emptyTechnicalData,
  visibleInspection,
  customerTechnicalRows,
  maintenanceTotals,
  maintenanceValidationErrors,
  readTechnicalData,
  technicalOrderItems,
  type TechnicalData,
} from './technical-order';

describe('technology intake', () => {
  test('a device that does not power on skips functional tests', () => {
    const data=emptyTechnicalData(); data.inspection['liga']='nao';
    expect(visibleInspection(data).map(q=>q.id)).toEqual(['pelicula','capinha','carcaca','tela','botoes','conector','chip','liga']);
  });
  test('a device without image stops tests requiring image', () => {
    const data=emptyTechnicalData(); data.inspection['liga']='sim';data.inspection['imagem']='nao';
    expect(visibleInspection(data).some(q=>q.id==='toque')).toBe(false);
    expect(visibleInspection(data).some(q=>q.id==='imagem')).toBe(true);
  });
  test('customer PDF does not include unlock credentials or internal part costs', () => {
    const data=emptyTechnicalData();
    data.password='secret-test-9482';data.pattern=[1,4,7,8];data.model='Notebook Pro';data.technical_status='pronto';
    data.parts=[{id:'p1',name:'Memória RAM 8 GB',brand:'Kingston',model:'DDR4',quantity:1,cost_price:90,sale_price:130}];
    const rows=customerTechnicalRows(data);
    expect(JSON.stringify(rows)).toContain('Notebook Pro');
    expect(JSON.stringify(rows)).toContain('Memória RAM 8 GB');
    expect(rows.some(row => row[0] === 'Status técnico' && row[1] === 'Pronto para retirada')).toBe(true);
    expect(JSON.stringify(rows)).not.toContain('secret-test-9482');
    expect(JSON.stringify(rows)).not.toContain('[1,4,7,8]');
    expect(JSON.stringify(rows)).not.toContain('90');
  });
  test('calculates labor, parts, extra expenses and discount without exposing cost price', () => {
    const data=emptyTechnicalData();
    data.services=[{id:'s1',description:'Limpeza interna',quantity:1,unit_price:80}];
    data.parts=[{id:'p1',name:'SSD 240 GB',brand:'Kingston',model:'A400',quantity:2,cost_price:100,sale_price:150}];
    data.additional_expenses=20;
    data.discount=30;
    expect(maintenanceTotals(data)).toEqual({services:80,parts:300,additional:20,discount:30,total:370});
    const items=technicalOrderItems(data);
    expect(items.reduce((sum,item)=>sum+item.subtotal,0)).toBe(400);
    expect(JSON.stringify(items)).not.toContain('cost_price');
    expect(JSON.stringify(items)).not.toContain('100');
  });
  test('caps discount at the gross total and never returns a negative total', () => {
    const data=emptyTechnicalData();
    data.services=[{id:'s1',description:'Diagnóstico',quantity:1,unit_price:50}];
    data.discount=500;
    expect(maintenanceTotals(data).total).toBe(0);
    expect(maintenanceTotals(data).discount).toBe(50);
  });
 
  test('rejects priced unnamed rows and excludes them from customer totals', () => {
    const data = emptyTechnicalData();
    data.services = [
      { id: 's1', description: 'Reparo identificado', quantity: 1, unit_price: 80 },
      { id: 's2', description: '', quantity: 1, unit_price: 50 },
    ];
    data.parts = [
      { id: 'p1', name: '', brand: '', model: '', quantity: 1, cost_price: 20, sale_price: 40 },
    ];
    expect(maintenanceValidationErrors(data)).toHaveLength(2);
    expect(maintenanceTotals(data).total).toBe(80);
    expect(technicalOrderItems(data).reduce((sum, item) => sum + item.subtotal, 0)).toBe(80);
  });

  test('normalizes negative and non-finite values consistently', () => {
    const data = emptyTechnicalData();
    data.services = [{ id: 's1', description: 'Diagnóstico', quantity: -2, unit_price: 100 }];
    data.additional_expenses = Number.POSITIVE_INFINITY;
    expect(maintenanceTotals(data).total).toBe(0);
    expect(maintenanceValidationErrors(data)).toContain("Informe uma quantidade maior que zero para cada serviço.");
    const items = technicalOrderItems(data);
    expect(items).toHaveLength(0);
    expect(items.some(item => !Number.isFinite(item.subtotal))).toBe(false);
  });


  test("normalizes malformed legacy JSON without crashing calculations or PDFs", () => {
    const data = readTechnicalData({
      services: [null, { id: 7, description: 42, quantity: "Infinity", unit_price: 50 }],
      parts: [null, { name: "SSD", quantity: 1, cost_price: "NaN", sale_price: 120 }],
      carriers: "not-an-array",
      pattern: [1, 1, 10, "3", 9],
      inspection: ["invalid"],
      discount: Number.POSITIVE_INFINITY,
      additional_expenses: -50,
    });
    expect(data.services).toHaveLength(1);
    expect(data.services[0].description).toBe("");
    expect(data.services[0].quantity).toBe(0);
    expect(data.parts[0].cost_price).toBe(0);
    expect(data.carriers).toEqual([]);
    expect(data.pattern).toEqual([1, 9]);
    expect(maintenanceTotals(data).total).toBe(120);
    expect(customerTechnicalRows(data).length).toBeGreaterThan(0);
    expect(technicalOrderItems(data).every(item => Number.isFinite(item.subtotal))).toBe(true);
  });

  test("allows an equipment intake to be saved before services or parts are entered", () => {
    const data = emptyTechnicalData();
    data.equipment = "Notebook";
    data.complaint = "Não liga";
    expect(technicalOrderItems(data)).toEqual([]);
    expect(maintenanceTotals(data).total).toBe(0);
  });

  test("uses the same rounded line subtotals in the order total", () => {
    const data = emptyTechnicalData();
    data.services = [
      { id: "s1", description: "Serviço 1", quantity: 1, unit_price: 0.005 },
      { id: "s2", description: "Serviço 2", quantity: 1, unit_price: 0.005 },
    ];
    const itemTotal = technicalOrderItems(data).reduce((sum, item) => sum + item.subtotal, 0);
    expect(itemTotal).toBe(0.02);
    expect(maintenanceTotals(data).total).toBe(itemTotal);
  });

  test("preserves additional legacy fields while normalizing known fields", () => {
    const data = readTechnicalData({ legacy_reference: "old-intake", equipment: "Notebook" });
    expect((data as TechnicalData & { legacy_reference?: string }).legacy_reference).toBe("old-intake");
    expect(data.equipment).toBe("Notebook");
  });
});