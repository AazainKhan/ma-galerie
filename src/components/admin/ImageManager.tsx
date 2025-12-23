import { Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

type Image = {
  id: number;
  src: string;
  width: number;
  height: number;
  alt: string | null;
  created_at: string;
  album_id: number | null;
};

type Album = {
  id: number;
  title: string;
};

export default function ImageManager() {
  const [images, setImages] = useState<Image[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch("/api/images");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setImages(data || []);
    } catch {
      toast.error("Failed to fetch images");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlbums = useCallback(async () => {
    try {
      const res = await fetch("/api/albums");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAlbums(data || []);
    } catch {
      // Silently fail if albums can't be fetched
    }
  }, []);

  useEffect(() => {
    fetchImages();
    fetchAlbums();
  }, [fetchImages, fetchAlbums]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      let successCount = 0;

      for (const file of acceptedFiles) {
        try {
          // 1. Get Dimensions (Client-side)
          const dimensions = await new Promise<{
            width: number;
            height: number;
          }>((resolve) => {
            const img = new Image();
            img.onload = () =>
              resolve({ width: img.width, height: img.height });
            img.src = URL.createObjectURL(file);
          });

          // 2. Upload to R2 via API (which also inserts to D1)
          const formData = new FormData();
          formData.append("file", file);
          formData.append("width", dimensions.width.toString());
          formData.append("height", dimensions.height.toString());

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Upload failed");

          successCount++;
        } catch (error) {
          console.error(error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} images`);
        fetchImages();
      }
      setUploading(false);
    },
    [fetchImages],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  const handleDelete = async (id: number, src: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    // Extract filename from URL (/image/filename)
    const fileName = src.split("/").pop();
    if (fileName) {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: fileName, id }),
      });

      if (!res.ok) {
        toast.error("Failed to delete image");
        return;
      }

      toast.success("Image deleted");
      setImages(images.filter((img) => img.id !== id));
    }
  };

  const handleUpdateAlbum = async (imageId: number, albumId: string) => {
    const val = albumId === "none" ? null : parseInt(albumId);

    const res = await fetch("/api/images/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: imageId, album_id: val }),
    });

    if (!res.ok) toast.error("Failed to update album");
    else {
      toast.success("Album updated");
      setImages(
        images.map((img) =>
          img.id === imageId ? { ...img, album_id: val } : img,
        ),
      );
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-2" />
            <p className="text-gray-500">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-lg font-medium text-gray-700">
              Drop images here, or click to select
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports JPG, PNG, WebP
            </p>
          </div>
        )}
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative bg-white rounded-lg shadow-sm border overflow-hidden"
          >
            <div className="aspect-square relative bg-gray-100">
              <img
                src={image.src}
                alt={image.alt || ""}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <button
                type="button"
                onClick={() => handleDelete(image.id, image.src)}
                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <p
                className="text-xs text-gray-500 truncate"
                title={image.alt || "No alt text"}
              >
                {image.alt || "No alt text"}
              </p>
              <select
                className="w-full text-xs border rounded px-2 py-1 bg-gray-50"
                value={image.album_id?.toString() || "none"}
                onChange={(e) => handleUpdateAlbum(image.id, e.target.value)}
              >
                <option value="none">No Album</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
