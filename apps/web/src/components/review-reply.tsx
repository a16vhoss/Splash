'use client';

import { useState } from 'react';

interface ReviewReplyProps {
  reviewId: string;
  existingReply?: string | null;
  replyDate?: string | null;
}

export function ReviewReply({ reviewId, existingReply, replyDate }: ReviewReplyProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [reply, setReply] = useState(existingReply || '');
  const [savedReply, setSavedReply] = useState(existingReply || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!reply.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuesta: reply }),
      });
      if (res.ok) {
        setSavedReply(reply);
        setIsEditing(false);
      }
    } catch {}
    setLoading(false);
  }

  if (savedReply && !isEditing) {
    return (
      <div className="mt-2 ml-4 pl-3 border-l-2 border-primary/30">
        <div className="text-[10px] text-muted-foreground mb-0.5">
          Respuesta del negocio {replyDate && `· ${new Date(replyDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
        </div>
        <p className="text-xs text-foreground">{savedReply}</p>
        <button onClick={() => setIsEditing(true)} className="text-[10px] text-primary mt-1 hover:underline">Editar</button>
      </div>
    );
  }

  if (!isEditing && !savedReply) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="mt-2 text-xs text-primary hover:underline"
      >
        Responder
      </button>
    );
  }

  return (
    <div className="mt-2 ml-4 pl-3 border-l-2 border-primary/30">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Escribe tu respuesta..."
        className="w-full text-xs text-foreground bg-muted rounded-card p-2 border-none outline-none resize-none h-16 placeholder:text-muted-foreground"
      />
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSubmit}
          disabled={loading || !reply.trim()}
          className="px-3 py-1 rounded-card bg-primary text-white text-[10px] font-semibold disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
        <button
          onClick={() => { setIsEditing(false); setReply(savedReply); }}
          className="px-3 py-1 rounded-card border border-border text-[10px] font-semibold text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
