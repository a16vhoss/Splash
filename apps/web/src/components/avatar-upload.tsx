'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast';

interface AvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  nombre: string | null;
  size?: number;
  onUploaded?: (url: string) => void;
}

export function AvatarUpload({ userId, currentUrl, nombre, size = 80, onUploaded }: AvatarUploadProps) {
  const supabase = createClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentUrl);

  const initial = nombre?.[0]?.toUpperCase() ?? '?';

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Solo se permiten imagenes', 'error');
      return;
    }

    setUploading(true);

    const ext = file.name.split('.').pop();
    const filePath = `avatars/${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast('Error al subir imagen', 'error');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const url = publicUrl + '?t=' + Date.now();

    await supabase
      .from('users')
      .update({ avatar_url: url })
      .eq('id', userId);

    setAvatarUrl(url);
    onUploaded?.(url);
    toast('Foto actualizada');
    setUploading(false);
  }

  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full bg-primary flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="font-extrabold text-white" style={{ fontSize: size * 0.35 }}>
            {initial}
          </span>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
