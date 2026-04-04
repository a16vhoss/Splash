'use client';

import { useState } from 'react';

interface PhotoGalleryProps {
  fotos: string[];
  nombre: string;
}

export function PhotoGallery({ fotos, nombre }: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="h-64 md:h-80 bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
        <span className="text-6xl font-extrabold text-white/30">{nombre.charAt(0)}</span>
      </div>
    );
  }

  function openLightbox(index: number) {
    setActiveIndex(index);
    setLightboxOpen(true);
  }

  return (
    <>
      {/* Gallery grid */}
      <div className="h-64 md:h-80 flex gap-1 overflow-hidden">
        {/* Main photo */}
        <button
          onClick={() => openLightbox(0)}
          className="flex-[2] relative cursor-pointer overflow-hidden"
        >
          <img src={fotos[0]} alt={nombre} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          {fotos.length > 3 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1.5 rounded-card text-xs font-semibold">
              Ver {fotos.length} fotos
            </div>
          )}
        </button>

        {/* Side photos */}
        {fotos.length > 1 && (
          <div className="flex-1 flex flex-col gap-1 hidden md:flex">
            {fotos.slice(1, 3).map((foto, i) => (
              <button
                key={i}
                onClick={() => openLightbox(i + 1)}
                className="flex-1 overflow-hidden cursor-pointer"
              >
                <img src={foto} alt={`${nombre} ${i + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white text-2xl font-bold hover:opacity-80 z-10"
          >
            ✕
          </button>

          {/* Navigation */}
          {fotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveIndex((activeIndex - 1 + fotos.length) % fotos.length); }}
                className="absolute left-4 text-white text-3xl font-bold hover:opacity-80 z-10"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveIndex((activeIndex + 1) % fotos.length); }}
                className="absolute right-4 text-white text-3xl font-bold hover:opacity-80 z-10"
              >
                ›
              </button>
            </>
          )}

          <img
            src={fotos[activeIndex]}
            alt={`${nombre} ${activeIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-card"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          <div className="absolute bottom-4 text-white text-sm font-semibold">
            {activeIndex + 1} / {fotos.length}
          </div>
        </div>
      )}
    </>
  );
}
