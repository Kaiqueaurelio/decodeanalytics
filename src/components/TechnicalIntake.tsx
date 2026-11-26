import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, ChevronLeft, ChevronRight, RotateCcw, Smartphone, Laptop, ShieldCheck, Plus, Trash2, Wrench, Cpu } from 'lucide-react';
import { visibleInspection, maintenanceTotals, type TechnicalData } from '@/lib/technical-order';

export function TechnicalIntake({ value, onChange, step, team }: { value: TechnicalData; onChange: (v: TechnicalData) => void; step: number; team: {id: string; name: string | null; email: string | null}[] }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const update = (patch: Partial<TechnicalData>) => onChange({...value, ...patch});
  const fields = (entries: {key: keyof TechnicalData; label: string; multiline?: boolean}[]) => entries.map(({key, label, multiline}) => <div key={key} className={multiline ? 'sm:col-span-2' : ''}><Label htmlFor={`tech-${key}`}>{label}</Label>{multiline ? <Textarea id={`tech-${key}`} value={String(value[key] ?? '')} onChange={e => update({[key]: e.target.value})} rows={3}/> : <Input id={`tech-${key}`} value={String(value[key] ?? '')} onChange={e => update({[key]: e.target.value})}/>}</div>);
  if (step === 1) return <div className="space-y-5">
    <h3 className="flex items-center gap-2 font-semibold"><Smartphone className="h-5 w-5 text-brand-blue"/> Equipamento recebido</h3>
    <div className="grid gap-3 sm:grid-cols-2">
      <div><Label>Tipo de equipamento *</Label><Select value={value.equipment} onValueChange={v => update({equipment:v})}><SelectTrigger aria-label="Tipo de equipamento"><SelectValue placeholder="Selecione o aparelho"/></SelectTrigger><SelectContent>{['Notebook','Computador desktop','All-in-one','Servidor','Smartphone','Tablet','Outro'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
      {fields([{key:'brand',label:'Marca'}, {key:'model',label:'Modelo'}, {key:'serial',label:'Nº de série'}, {key:'color',label:'Cor'}, {key:'accessories',label:'Acessórios entregues'}])}
    </div>
    <div className="space-y-3 border-y py-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><Label>Desbloqueio (opcional)</Label><div className="flex gap-1">{(['senha','padrao'] as const).map(mode=><Button key={mode} size="sm" variant={value.unlock_mode===mode?'default':'outline'} onClick={()=>update({unlock_mode:mode})}>{mode==='senha'?'Senha':'Padrão'}</Button>)}</div></div>
      {value.unlock_mode==='senha' ? <div className="flex gap-2"><Input aria-label="Senha do dispositivo" autoComplete="new-password" type={showPassword?'text':'password'} value={value.password} onChange={e=>update({password:e.target.value})}/><Button variant="outline" onClick={()=>setShowPassword(!showPassword)}>{showPassword?'Ocultar':'Mostrar'}</Button></div> : <div className="flex flex-col items-center gap-3"><div className="grid w-56 grid-cols-3 gap-3 rounded-md bg-muted p-4">{Array.from({length:9},(_,i)=>i+1).map(n=><Button aria-label={`Ponto ${n}`} aria-pressed={value.pattern.includes(n)} size="icon" className="h-12 w-12 shrink-0" variant={value.pattern.includes(n)?'default':'outline'} key={n} onClick={()=>{if(!value.pattern.includes(n)) update({pattern:[...value.pattern,n]});}}>{n}</Button>)}</div><div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{value.pattern.join(' → ') || 'Sem padrão registrado'}</span><Button size="icon" variant="ghost" aria-label="Limpar padrão" onClick={()=>update({pattern:[]})}><RotateCcw className="h-4 w-4"/></Button></div></div>}
    </div>
    {fields([{key:'complaint',label:'Defeito relatado pelo cliente *',multiline:true}])}
  </div>;
  if (step === 2) {
    const questions=visibleInspection(value); const index=Math.min(questionIndex, questions.length-1); const question=questions[index]; if(!question)return null;
    const answered=questions.filter(q=>value.inspection[q.id]).length;
    return <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-brand-blue"/> Checklist de entrada</h3><span className="text-sm text-muted-foreground">{answered}/{questions.length} respondidos</span></div>
      <progress aria-label="Progresso do checklist" className="h-2 w-full accent-brand-blue" max={questions.length} value={answered}/>
      <div className="flex min-h-52 flex-col items-center justify-center gap-5 border-y py-6 text-center"><Laptop className="h-12 w-12 text-brand-blue"/><span className="text-xs text-muted-foreground">{index+1} / {questions.length}</span><h4 className="text-xl font-semibold">{question.title}</h4><div className="flex flex-wrap justify-center gap-2">{([{id:'nao',label:'Não'},{id:'sim',label:'Sim'},{id:'na',label:'Não testado'}] as const).map(answer=><Button key={answer.id} variant={value.inspection[question.id]===answer.id?'default':'outline'} onClick={()=>{update({inspection:{...value.inspection,[question.id]:answer.id}});setQuestionIndex(Math.min(index+1,questions.length-1));}}>{value.inspection[question.id]===answer.id && <Check className="h-4 w-4"/>}{answer.label}</Button>)}</div></div>
      <div className="flex justify-between"><Button variant="ghost" disabled={index===0} onClick={()=>setQuestionIndex(index-1)}><ChevronLeft className="h-4 w-4"/>Anterior</Button><Button variant="ghost" disabled={index===questions.length-1} onClick={()=>setQuestionIndex(index+1)}>Próximo<ChevronRight className="h-4 w-4"/></Button></div>
      {value.inspection['liga']==='nao' && <p className="text-sm text-muted-foreground">Equipamento não liga: testes funcionais dispensados.</p>}
      <div className="grid gap-3 sm:grid-cols-2">{fields([{key:'inspection_notes',label:'Avarias, marcas e condições de entrada',multiline:true}])}</div>
    </div>;
  }
  if (step === 3) {
    const totals = maintenanceTotals(value);
    const updateService = (id: string, patch: Partial<TechnicalData['services'][number]>) => update({services:value.services.map(item=>item.id===id?{...item,...patch}:item)});
    const updatePart = (id: string, patch: Partial<TechnicalData['parts'][number]>) => update({parts:value.parts.map(item=>item.id===id?{...item,...patch}:item)});
    return <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold"><Wrench className="h-5 w-5 text-brand-blue"/> Serviços e reparos executados</h3>
        {value.services.map(item=><div key={item.id} className="grid grid-cols-12 gap-2 rounded-lg border p-3">
          <div className="col-span-12"><Label>O que foi feito</Label><Input value={item.description} placeholder="Ex.: Limpeza interna e troca de pasta térmica" onChange={e=>updateService(item.id,{description:e.target.value})}/></div>
          <div className="col-span-4"><Label>Quantidade</Label><Input type="number" min="1" step="1" value={item.quantity} onChange={e=>updateService(item.id,{quantity:Math.max(1,Number(e.target.value)||1)})}/></div>
          <div className="col-span-6"><Label>Valor unitário (R$)</Label><Input type="number" min="0" step="0.01" value={item.unit_price} onChange={e=>updateService(item.id,{unit_price:Math.max(0,Number(e.target.value)||0)})}/></div>
          <div className="col-span-2 flex items-end justify-end"><Button type="button" size="icon" variant="ghost" aria-label="Remover serviço" onClick={()=>update({services:value.services.filter(x=>x.id!==item.id)})}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
        </div>)}
        <Button type="button" size="sm" variant="outline" onClick={()=>update({services:[...value.services,{id:crypto.randomUUID(),description:'',quantity:1,unit_price:0}]})}><Plus className="h-4 w-4 mr-1"/>Adicionar serviço</Button>
      </section>
      <section className="space-y-3 border-t pt-4">
        <h3 className="flex items-center gap-2 font-semibold"><Cpu className="h-5 w-5 text-brand-blue"/> Peças e componentes substituídos</h3>
        {value.parts.map(item=><div key={item.id} className="grid grid-cols-12 gap-2 rounded-lg border p-3">
          <div className="col-span-12 sm:col-span-5"><Label>Peça / componente</Label><Input value={item.name} placeholder="Ex.: Memória RAM DDR4 8 GB" onChange={e=>updatePart(item.id,{name:e.target.value})}/></div>
          <div className="col-span-6 sm:col-span-3"><Label>Marca</Label><Input value={item.brand} onChange={e=>updatePart(item.id,{brand:e.target.value})}/></div>
          <div className="col-span-6 sm:col-span-4"><Label>Modelo</Label><Input value={item.model} onChange={e=>updatePart(item.id,{model:e.target.value})}/></div>
          <div className="col-span-4"><Label>Qtd.</Label><Input type="number" min="1" step="1" value={item.quantity} onChange={e=>updatePart(item.id,{quantity:Math.max(1,Number(e.target.value)||1)})}/></div>
          <div className="col-span-4"><Label>Custo unitário (interno)</Label><Input type="number" min="0" step="0.01" value={item.cost_price} onChange={e=>updatePart(item.id,{cost_price:Math.max(0,Number(e.target.value)||0)})}/></div>
          <div className="col-span-4"><Label>Preço cobrado</Label><Input type="number" min="0" step="0.01" value={item.sale_price} onChange={e=>updatePart(item.id,{sale_price:Math.max(0,Number(e.target.value)||0)})}/></div>
          <div className="col-span-12 flex justify-end"><Button type="button" size="sm" variant="ghost" onClick={()=>update({parts:value.parts.filter(x=>x.id!==item.id)})}><Trash2 className="h-4 w-4 mr-1 text-destructive"/>Remover peça</Button></div>
        </div>)}
        <Button type="button" size="sm" variant="outline" onClick={()=>update({parts:[...value.parts,{id:crypto.randomUUID(),name:'',brand:'',model:'',quantity:1,cost_price:0,sale_price:0}]})}><Plus className="h-4 w-4 mr-1"/>Adicionar peça</Button>
      </section>
      <section className="space-y-3 border-t pt-4">
        <h3 className="font-semibold">Aprovação do orçamento (opcional)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Status da aprovação</Label><Select value={value.approval_status} onValueChange={v=>update({approval_status:v as TechnicalData['approval_status']})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="nao_solicitado">Não solicitada</SelectItem><SelectItem value="aguardando">Aguardando aprovação</SelectItem><SelectItem value="aprovado">Aprovado</SelectItem><SelectItem value="recusado">Recusado</SelectItem></SelectContent></Select></div>
          <div><Label>Quem aprovou (cliente/responsável)</Label><Input value={value.approval_contact} onChange={e=>update({approval_contact:e.target.value})} placeholder="Nome de quem autorizou"/></div>
          <div><Label>Data e hora da aprovação</Label><Input type="datetime-local" value={value.approval_date} onChange={e=>update({approval_date:e.target.value})}/></div>
          <div><Label>Observações da aprovação</Label><Input value={value.approval_notes} onChange={e=>update({approval_notes:e.target.value})}/></div>
        </div>
      </section>
      <section className="space-y-3 border-t pt-4">
        <h3 className="font-semibold">Resumo financeiro</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Despesas adicionais (R$)</Label><Input type="number" min="0" step="0.01" value={value.additional_expenses} onChange={e=>update({additional_expenses:Math.max(0,Number(e.target.value)||0)})}/></div>
          <div><Label>Desconto (R$)</Label><Input type="number" min="0" step="0.01" value={value.discount} onChange={e=>update({discount:Math.max(0,Number(e.target.value)||0)})}/></div>
        </div>
        <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
          <div className="flex justify-between"><span>Serviços</span><span>{totals.services.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>
          <div className="flex justify-between"><span>Peças (preço de venda)</span><span>{totals.parts.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>
          <div className="flex justify-between"><span>Despesas adicionais</span><span>{totals.additional.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>
          <div className="flex justify-between"><span>Desconto</span><span>- {totals.discount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>
          <div className="flex justify-between border-t pt-2 font-bold text-base"><span>Valor total</span><span>{totals.total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>
          <p className="text-xs text-muted-foreground">O custo de aquisição das peças é interno e não aparece no documento do cliente.</p>
        </div>
      </section>
      <section className="space-y-3 border-t pt-4">
        <h3 className="font-semibold">Conclusão e garantia</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Status técnico</Label><Select value={value.technical_status} onValueChange={v=>update({technical_status:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{[['aguardando_avaliacao','Aguardando avaliação'],['em_diagnostico','Em diagnóstico'],['aguardando_aprovacao','Aguardando aprovação'],['aguardando_pecas','Aguardando peças'],['em_reparo','Em reparo'],['pronto','Pronto para retirada']].map(([id,label])=><SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Garantia (dias)</Label><Input type="number" min="0" value={value.warranty_days} onChange={e=>update({warranty_days:Math.max(0,Number(e.target.value)||0)})}/></div>
          <div className="sm:col-span-2"><Label>Serviços executados / observações finais</Label><Textarea rows={3} value={value.completion_notes} onChange={e=>update({completion_notes:e.target.value})} placeholder="Descreva os testes finais, resultados e orientações ao cliente"/></div>
          <div className="sm:col-span-2"><Label>Termos e condições acordados</Label><Textarea rows={2} value={value.terms} onChange={e=>update({terms:e.target.value})}/></div>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 border-t pt-4">
        <div><Label>Atendente</Label><Select value={value.attendant_id || 'none'} onValueChange={v=>update({attendant_id:v==='none'?'':v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Não informado</SelectItem>{team.map(p=><SelectItem key={p.id} value={p.id}>{p.name||p.email}</SelectItem>)}</SelectContent></Select></div>
      </section>
    </div>;
  }
  return null;
}
