'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast';

interface CarWashPhotoUploadProps {
  carWashId: string;
  initialFotos: string[];
}

export function CarWashPhotoUpload({ carWashId, initialFotos }: CarWashPhotoUploadProps) {
  const supabase = createClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<string[]>(initialFotos);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Solo se permiten imagenes', 'error');
      return;
    }

    setUploading(true);

    const ext = file.name.split('.').pop();
    const fileName = `${carWashId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('car-wash-photos')
      .upload(fileName, file);

    if (uploadError) {
      toast('Error al subir imagen', 'error');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('car-wash-photos')
      .getPublicUrl(fileName);

    const newFotos = [...fotos, publicUrl];

    const { error: updateError } = await supabase
      .from('car_washes')
      .update({ fotos: newFotos })
      .eq('id', carWashId);

    if (updateError) {
      toast('Error al guardar foto', 'error');
      setUploading(false);
      return;
    }

    setFotos(newFotos);
    toast('Foto agregada');
    setUploading(false);

    // Reset input
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleDelete(index: number) {
    const url = fotos[index];
    const newFotos = fotos.filter((_, i) => i !== index);

    const { error } = await supabase
      .from('car_washes')
      .update({ fotos: newFotos })
      .eq('id', carWashId);

    if (error) {
      toast('Error al eliminar foto', 'error');
      return;
    }

    // Try to delete from storage (extract path from URL)
    const match = url.match(/car-wash-photos\/(.+?)(\?|$)/);
    if (match) {
      await supabase.storage.from('car-wash-photos').remove([match[1]]);
    }

    setFotos(newFotos);
    toast('Foto eliminada');
  }

  return (
    <div className="rounded-card bg-card shadow-card">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Fotos de tu autolavado</h3>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-input bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
        >
          {uploading ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Agregar foto
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {fotos.length === 0 ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="px-6 py-10 text-center cursor-pointer hover:bg-muted/30 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground/50 mb-2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-sm text-muted-foreground">Haz clic para agregar la primera foto de tu autolavado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Las fotos aparecen en tu perfil publico</p>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {fotos.map((foto, i) => (
            <div key={i} className="relative group aspect-[4/3] rounded-lg overflow-hidden">
              <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold hover:bg-red-600"
              >
                ✕
              </button>
              {i === 0 && (
                <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                  Principal
                </div>
              )}
            </div>
          ))}

          {/* Add more button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-[4/3] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-xs mt-1">Agregar</span>
          </button>
        </div>
      )}
    </div>
  );
}
