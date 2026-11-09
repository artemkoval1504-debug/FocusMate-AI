import { useRef, useState } from 'react';

const MAX_PHOTOS = 5;

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, Math.max(0, MAX_PHOTOS - photos.length));

    Promise.all(
      imageFiles.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
      ),
    ).then((urls) => onChange([...photos, ...urls]));
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-5">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-white/15 bg-white/[0.02] hover:border-blue-500/40'
        }`}
      >
        <span className="text-2xl">📷</span>
        <p className="text-sm font-medium text-slate-300">Завантаж або перетягни фотографії</p>
        <p className="text-xs text-slate-500">Скріншот ТЗ, план, фото — що завгодно, що пояснює завдання</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border border-white/10">
              <img src={p} alt={`Фото ${i + 1}`} className="h-full w-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs text-white transition hover:bg-red-500/80"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
