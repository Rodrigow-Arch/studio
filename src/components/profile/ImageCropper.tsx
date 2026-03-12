
"use client";

import * as React from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getCroppedImg } from '@/lib/utils';
import { ZoomIn, ZoomOut, Check } from 'lucide-react';

interface ImageCropperProps {
  image: string | null;
  aspect?: number;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, aspect = 1, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleDone = async () => {
    if (!image || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  if (!image) return null;

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-[400px] h-[550px] p-0 overflow-hidden flex flex-col rounded-3xl z-[200]">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="text-center font-headline">Ajustar Foto</DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative bg-black/90">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={aspect === 1 ? "round" : "rect"}
            showGrid={false}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="p-6 space-y-6 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(vals) => setZoom(vals[0])}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="ghost" className="flex-1 rounded-xl h-12" onClick={onCancel}>
              Cancelar
            </Button>
            <Button className="flex-1 bg-primary text-white font-black rounded-xl h-12 gap-2" onClick={handleDone}>
              <Check className="w-5 h-5" /> Concluído
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
