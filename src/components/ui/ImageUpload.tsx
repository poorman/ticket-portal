import { useRef, useState, useCallback, useEffect } from 'react';
import { X, Clipboard, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage } from '../../lib/image-utils';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB raw (compression will shrink it)

export default function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [compressing, setCompressing] = useState(0);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} is not an image`);
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(`${file.name} exceeds 10MB limit`);
      return;
    }

    setCompressing((c) => c + 1);
    try {
      const compressed = await compressImage(file);
      if (compressed) {
        onChange([...images, compressed]);
      }
    } finally {
      setCompressing((c) => c - 1);
    }
  }, [images, onChange]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }
    Array.from(files).slice(0, remaining).forEach(processFile);
  }, [maxImages, images.length, processFile]);

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(imageFiles);
        toast.success(`Pasted ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}`);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handleFiles]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((src, i) => (
            <div key={i} className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded overflow-hidden border border-white/10">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {compressing > 0 && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded border border-white/10 flex items-center justify-center">
              <Loader2 size={16} className="text-gray-500 animate-spin" />
            </div>
          )}
        </div>
      )}

      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`drop-zone cursor-pointer ${dragging ? 'active' : ''}`}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <div className="flex items-center gap-3">
              <Upload size={16} />
              <span className="text-sm">Drop images here, click to browse</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Clipboard size={12} />
              <span>or paste from clipboard (Ctrl+V)</span>
            </div>
            <span className="text-[11px] text-gray-600">
              {images.length}/{maxImages} images
              {compressing > 0 && ` (compressing ${compressing}...)`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
