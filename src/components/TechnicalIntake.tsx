import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, ChevronLeft, ChevronRight, RotateCcw, Smartphone, Laptop, ShieldCheck, ImagePlus, Trash2 } from 'lucide-react';
import { visibleInspection, type TechnicalData } from '@/lib/technical-order';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function TechnicalIntake({ value, onChange, step, team, photoFiles, onPhotoFilesChange }: { value: TechnicalData; onChange: (v: TechnicalData) => void; step: number; team: {id: string; name: string | null; email: string | null}[]; photoFiles: File[]; onPhotoFilesChange: (files: File[]) => void }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [signedPhotos, setSignedPhotos] = useState<Record<string, string>>({});
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);
  const update = (patch: Partial<TechnicalData>) => onChange({...value, ...patch});
  useEffect(() => {
    let active = true;
    if (!value.photos.length) { setSignedPhotos({}); return; }
    void supabase.storage.from('technical-order-photos').createSignedUrls(value.photos, 1800).then(({data}) => {
      if (active) setSignedPhotos(Object.fromEntries((data ?? []).flatMap((item, index) => item.signedUrl ? [[value.photos[index], item.signedUrl]] : [])));
    });
    return () => { active = false; };
  }, [value.photos.join('|')]);
  useEffect(() => {
    const urls = photoFiles.map(file => URL.createObjectURL(file));
    setPreviewPhotos(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [photoFiles]);
  const fields = (entries: {key: keyof TechnicalData; label: string; multiline?: boolean}[]) => entries.map(({key, label, multiline}) => <div key={key} className={multiline ? 'sm:col-span-2' : ''}><Label htmlFor={`tech-${key}`}>{label}</Label>{multiline ? <Textarea id={`tech-${key}`} value={String(value[key])} onChange={e => update({[key]: e.target.value})} rows={3}/> : <Input id={`tech-${key}`} value={String(value[key])} onChange={e => update({[key]: e.target.value})}/>}</div>);
  if (step === 1) return <div className="space-y-5">
    <h3 className="flex items-center gap-2 font-semibold"><Smartphone className="h-5 w-5 text-brand-blue"/> Equipamento recebido</h3>
    <div className="grid gap-3 sm:grid-cols-2">
      <div><Label>Tipo de equipamento *</Label><Select value={value.equipment} onValueChange={v => update({equipment:v})}><SelectTrigger aria-label="Tipo de equipamento"><SelectValue placeholder="Selecione o aparelho"/></SelectTrigger><SelectContent>{['Smartphone','Notebook','Computador desktop','Tablet','Smartwatch','Caixa de som','Servidor','Outro'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
      {fields([{key:'brand',label:'Marca'}, {key:'model',label:'Modelo'}, {key:'serial',label:'Nº de série / IMEI'}, {key:'color',label:'Cor'}, {key:'accessories',label:'Acessórios entregues'}])}
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
      {value.inspection['liga']==='nao' && <p className="text-sm text-muted-foreground">Aparelho não liga: testes de funcionamento dispensados.</p>}
      <section className="space-y-3 rounded-xl border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h4 className="text-sm font-semibold">Fotos da entrada</h4><p className="text-xs text-muted-foreground">Registre avarias, acessórios e o estado do aparelho. Máximo 8 fotos, 5 MB cada.</p></div>
          <Button type="button" variant="outline" onClick={() => document.getElementById('technical-intake-photos')?.click()}><ImagePlus className="mr-2 h-4 w-4"/>Adicionar fotos</Button>
          <Input id="technical-intake-photos" className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" multiple onChange={event => {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
            const selected = Array.from(event.target.files ?? []).filter(file => allowedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024);
            if (selected.length !== (event.target.files?.length ?? 0)) toast.error('Use imagens de até 5 MB cada.');
            const available = Math.max(0, 8 - value.photos.length - photoFiles.length);
            if (selected.length > available) toast.error('O limite é de 8 fotos por ordem.');
            onPhotoFilesChange([...photoFiles, ...selected.slice(0, available)]);
            event.target.value = '';
          }}/>
        </div>
        {(value.photos.length > 0 || photoFiles.length > 0) && <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {value.photos.map(path => signedPhotos[path] && <figure key={path} className="relative overflow-hidden rounded-lg border"><img src={signedPhotos[path]} alt="Foto do aparelho recebido" className="h-28 w-full object-cover"/><Button type="button" size="icon" variant="destructive" aria-label="Remover foto salva" className="absolute right-1 top-1 h-7 w-7" onClick={() => update({photos:value.photos.filter(item => item !== path)})}><Trash2 className="h-3.5 w-3.5"/></Button></figure>)}
          {previewPhotos.map((url, index) => <figure key={`${url}-${index}`} className="relative overflow-hidden rounded-lg border"><img src={url} alt={`Nova foto ${index + 1} do aparelho`} className="h-28 w-full object-cover"/><Button type="button" size="icon" variant="destructive" aria-label="Remover foto nova" className="absolute right-1 top-1 h-7 w-7" onClick={() => onPhotoFilesChange(photoFiles.filter((_, item) => item !== index))}><Trash2 className="h-3.5 w-3.5"/></Button></figure>)}
        </div>}
      </section>
      <div className="grid gap-3 sm:grid-cols-2">{value.inspection['chip']==='sim' && <div className="sm:col-span-2"><Label>Operadoras / cartão de memória</Label><div className="flex flex-wrap gap-2">{['Vivo','TIM','Claro','Outra operadora','Cartão de memória'].map(c=><label key={c} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={value.carriers.includes(c)} onChange={e=>update({carriers:e.target.checked?[...value.carriers,c]:value.carriers.filter(v=>v!==c)})}/>{c}</label>)}</div></div>}{fields([{key:'inspection_notes',label:'Avarias, marcas e condições de entrada',multiline:true}])}</div>
    </div>;
  }
  return <div className="grid gap-3 border-b pb-5 sm:grid-cols-2">
    {fields([{key:'diagnosis',label:'Laudo prévio / diagnóstico',multiline:true},{key:'resolution',label:'Laudo final / solução e peças trocadas',multiline:true}])}
    <div><Label>Status técnico</Label><Select value={value.technical_status} onValueChange={v=>update({technical_status:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{[['aguardando_avaliacao','Aguardando avaliação'],['em_diagnostico','Em diagnóstico'],['aguardando_aprovacao','Aguardando aprovação'],['aguardando_pecas','Aguardando peças'],['em_reparo','Em reparo'],['pronto','Pronto para retirada']].map(([id,label])=><SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select></div>
    <div><Label htmlFor="warranty-days">Garantia (dias)</Label><Input id="warranty-days" type="number" min={0} value={value.warranty_days} onChange={e=>update({warranty_days:Math.max(0,Number(e.target.value))})}/></div>
    <div><Label>Atendente</Label><Select value={value.attendant_id || 'none'} onValueChange={v=>update({attendant_id:v==='none'?'':v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Não informado</SelectItem>{team.map(p=><SelectItem key={p.id} value={p.id}>{p.name||p.email}</SelectItem>)}</SelectContent></Select></div>
    {fields([{key:'terms',label:'Termos e condições acordados',multiline:true}])}
  </div>;
}
