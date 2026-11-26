import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { photoCategories, type TechnicalData, type TechnicalPhoto } from '@/lib/technical-order';

export function TechnicalPhotoGallery({ value, onChange, onBusy }: { value: TechnicalData; onChange: (v: TechnicalData) => void; onBusy: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const current = useRef(value);
  current.current = value;
  const paths = value.photos.map(p => p.storage_path).join('|');
  useEffect(() => {
    let active = true;
    const list = paths ? paths.split('|') : [];
    if (!list.length) {
      setUrls({});
      setError(false);
      return;
    }
    setError(false);
    void supabase.storage.from('technical-photos').createSignedUrls(list, 3600)
      .then(({ data, error: loadError }) => {
        if (!active) return;
        const valid = (data ?? []).filter((photo) => photo.signedUrl && photo.path);
        setError(Boolean(loadError) || valid.length !== list.length);
        setUrls(Object.fromEntries(valid.map((photo) => [photo.path, photo.signedUrl])));
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setUrls({});
      });
    return () => { active = false; };
  }, [paths]);
  async function upload(files: FileList | null) {
    if (!files?.length || busy) return;
    const selected = Array.from(files);
    if (selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      toast.error('Selecione fotos JPG, PNG ou WebP de até 10 MB.');
      return;
    }

    setBusy(true);
    onBusy(true);
    const uploaded: TechnicalPhoto[] = [];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Entre novamente para anexar fotos.');

      for (const file of selected) {
        const id = crypto.randomUUID();
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `${user.id}/${id}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('technical-photos').upload(path, file, { contentType: file.type });
        if (uploadError) throw uploadError;
        uploaded.push({ id, storage_path: path, caption: '', category: 'antes', part_id: '' });
      }
    } catch (error) {
      if (uploaded.length) {
        onChange({ ...current.current, photos: [...current.current.photos, ...uploaded] });
      }
      toast.error(error instanceof Error ? error.message : 'Não foi possível anexar todas as fotos.');
      return;
    } finally {
      setBusy(false);
      onBusy(false);
      if (input.current) input.current.value = '';
    }

    if (uploaded.length) {
      onChange({ ...current.current, photos: [...current.current.photos, ...uploaded] });
      toast.success(`${uploaded.length} foto(s) anexada(s). Salve a ordem para guardar o registro.`);
    }
  }
  function update(id: string, patch: Partial<TechnicalPhoto>) {
    onChange({...value, photos: value.photos.map(p => p.id === id ? {...p, ...patch} : p)});
  }
  return <section className="space-y-4 border-t pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 font-semibold"><Camera className="h-5 w-5 text-brand-blue"/>Laudo fotográfico</h3>
      <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Camera className="h-4 w-4"/>}Anexar fotos</Button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" aria-label="Fotos técnicas" onChange={e => void upload(e.target.files)}/>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">Não foi possível carregar algumas fotos. Reabra a ordem para tentar novamente.</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      {value.photos.map(photo => <article key={photo.id} className="min-w-0 space-y-3 rounded-lg border p-3">
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted">{urls[photo.storage_path] ? <img src={urls[photo.storage_path]} alt={photo.caption || photoCategories[photo.category]} className="h-full w-full object-contain"/> : <Camera className="h-8 w-8 text-muted-foreground"/>}</div>
        <div><Label htmlFor={`caption-${photo.id}`}>Descrição / justificativa da foto</Label><Input id={`caption-${photo.id}`} value={photo.caption} onChange={e => update(photo.id, {caption:e.target.value})}/></div>
        <Select value={photo.category} onValueChange={category => update(photo.id, {category:category as TechnicalPhoto['category']})}><SelectTrigger aria-label="Etapa da foto"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(photoCategories).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={photo.part_id || 'none'} onValueChange={id => update(photo.id, {part_id:id === 'none' ? '' : id})}><SelectTrigger aria-label="Peça relacionada"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Equipamento / sem peça específica</SelectItem>{value.parts.filter(p => p.name.trim()).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => { if (window.confirm('Remover esta foto da ordem?')) onChange({...value, photos:value.photos.filter(p => p.id !== photo.id)}); }}><Trash2 className="h-4 w-4 text-destructive"/>Remover foto</Button>
      </article>)}
    </div>
  </section>;
}