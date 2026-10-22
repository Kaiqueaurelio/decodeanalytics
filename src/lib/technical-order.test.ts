import { describe, test, expect } from 'vitest';
import { emptyTechnicalData, visibleInspection, customerTechnicalRows } from './technical-order';
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
  test('customer PDF does not include unlock credentials', () => {
    const data=emptyTechnicalData();data.password='secret-test-9482';data.pattern=[1,4,7,8];data.model='iPhone 11';
    const rows=customerTechnicalRows(data);
    expect(JSON.stringify(rows)).toContain('iPhone 11');
    expect(JSON.stringify(rows)).not.toContain('secret-test-9482');
    expect(JSON.stringify(rows)).not.toContain('[1,4,7,8]');
  });
});
