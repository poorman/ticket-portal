import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function ImageGallery({ images }: { images: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!images.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setSelected(src)}
            className="w-16 h-16 sm:w-24 sm:h-24 rounded overflow-hidden border border-white/10 hover:border-crane transition-colors cursor-pointer"
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {createPortal(
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90"
              onClick={() => setSelected(null)}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              >
                <X size={24} />
              </button>
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={selected}
                alt=""
                className="max-w-full max-h-[90vh] rounded shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
