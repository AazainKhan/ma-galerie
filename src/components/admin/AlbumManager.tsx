import {
  Check,
  ChevronDown,
  ChevronRight,
  Edit2,
  Folder,
  Grid3x3,
  ImageIcon,
  List,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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
  slug: string;
  description: string | null;
  created_at: string;
  cover_image_id: number | null;
  cover_image_src: string | null;
};

export default function AlbumManager() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [expandedAlbums, setExpandedAlbums] = useState<Set<number>>(new Set());
  const [uploadingAlbum, setUploadingAlbum] = useState<number | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingImage, setEditingImage] = useState<number | null>(null);
  const [editingAlt, setEditingAlt] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploadingIcon, setUploadingIcon] = useState<number | null>(null);

  const fetchAlbums = useCallback(async () => {
    try {
      const res = await fetch("/api/albums");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAlbums(data || []);
    } catch {
      toast.error("Failed to fetch albums");
    }
  }, []);

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

  useEffect(() => {
    fetchAlbums();
    fetchImages();
  }, [fetchAlbums, fetchImages]);

  const toggleAlbum = (albumId: number) => {
    setExpandedAlbums((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(albumId)) {
        newSet.delete(albumId);
      } else {
        newSet.add(albumId);
      }
      return newSet;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    try {
      const res = await fetch("/api/albums/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, slug }),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast.success("Album created");
      setNewTitle("");
      fetchAlbums();
    } catch {
      toast.error("Failed to create album");
    }
  };

  const handleRenameAlbum = async (albumId: number) => {
    if (!editingTitle.trim()) return;

    const slug = editingTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    try {
      const res = await fetch("/api/albums/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: albumId, title: editingTitle, slug }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Album renamed");
      setEditingAlbum(null);
      setEditingTitle("");
      fetchAlbums();
    } catch {
      toast.error("Failed to rename album");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this album? Images will remain but be unassigned."))
      return;

    try {
      const res = await fetch("/api/albums/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Album deleted");
      setAlbums(albums.filter((a) => a.id !== id));
    } catch {
      toast.error("Failed to delete album");
    }
  };

  const handleDeleteImage = async (id: number, src: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    const fileName = src.split("/").pop();
    if (fileName) {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const handleRenameImage = async (imageId: number) => {
    try {
      const res = await fetch("/api/images/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: imageId, alt: editingAlt }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Image renamed");
      setEditingImage(null);
      setEditingAlt("");
      setImages(
        images.map((img) =>
          img.id === imageId ? { ...img, alt: editingAlt } : img,
        ),
      );
    } catch {
      toast.error("Failed to rename image");
    }
  };

  const handleIconUpload = async (albumId: number, file: File) => {
    setUploadingIcon(albumId);

    try {
      const dimensions = await new Promise<{ width: number; height: number }>(
        (resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.src = URL.createObjectURL(file);
        },
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append("width", dimensions.width.toString());
      formData.append("height", dimensions.height.toString());
      formData.append("album_id", albumId.toString());
      formData.append("is_cover", "true");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      // Update the album with the new cover image
      const updateRes = await fetch("/api/albums/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: albumId,
          cover_image_id: data.imageId,
        }),
      });

      if (!updateRes.ok) throw new Error("Failed to update album");

      toast.success("Album icon updated");
      fetchAlbums();
      fetchImages();
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload icon");
    } finally {
      setUploadingIcon(null);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], albumId: number) => {
      setUploadingAlbum(albumId);
      let successCount = 0;

      for (const file of acceptedFiles) {
        try {
          const dimensions = await new Promise<{
            width: number;
            height: number;
          }>((resolve) => {
            const img = new Image();
            img.onload = () =>
              resolve({ width: img.width, height: img.height });
            img.src = URL.createObjectURL(file);
          });

          const formData = new FormData();
          formData.append("file", file);
          formData.append("width", dimensions.width.toString());
          formData.append("height", dimensions.height.toString());
          formData.append("album_id", albumId.toString());

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
      setUploadingAlbum(null);
    },
    [fetchImages],
  );

  const getImagesForAlbum = (albumId: number) => {
    return images.filter((img) => img.album_id === albumId);
  };

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" style={{ color: "var(--text)" }} />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header with Create Form and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <form
          onSubmit={handleCreate}
          className="flex-1 flex gap-4 items-end admin-bg-muted p-4 rounded-lg admin-border border"
        >
          <div className="flex-1">
            <label
              htmlFor="new-album-title"
              className="block text-sm font-medium admin-text-muted mb-1"
            >
              New Album Title
            </label>
            <input
              id="new-album-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="admin-input w-full px-3 py-2 rounded-md"
              placeholder="e.g. Summer 2024"
            />
          </div>
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="admin-button flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Create
          </button>

          {/* View Toggle - moved inside form */}
          <div className="admin-toggle-group flex gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "admin-toggle-item",
                viewMode === "grid" && "active",
              )}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "admin-toggle-item",
                viewMode === "list" && "active",
              )}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Album List */}
      <div
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 gap-4 items-start"
            : "space-y-4",
        )}
      >
        {albums.map((album) => {
          const albumImages = getImagesForAlbum(album.id);
          const isExpanded = expandedAlbums.has(album.id);
          const isUploading = uploadingAlbum === album.id;
          const isEditing = editingAlbum === album.id;

          return (
            <div
              key={album.id}
              className={cn(
                "admin-card-inner rounded-lg overflow-hidden",
                // When expanded in grid view, span full width
                viewMode === "grid" && isExpanded && "md:col-span-2",
              )}
            >
              {/* Album Header */}
              <div className="flex items-center justify-between p-4 admin-bg-muted">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleAlbum(album.id)}
                    className="admin-icon-btn"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  {/* Album Icon with Upload */}
                  <div className="relative group/icon">
                    {album.cover_image_src ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden admin-bg-muted">
                        <img
                          src={album.cover_image_src}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="p-2 admin-bg-muted rounded-full">
                        <Folder
                          className="w-5 h-5"
                          style={{ color: "var(--text)", opacity: 0.6 }}
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`icon-upload-${album.id}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleIconUpload(album.id, file);
                      }}
                    />
                    <label
                      htmlFor={`icon-upload-${album.id}`}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/icon:opacity-100 transition-opacity cursor-pointer rounded-full"
                      title="Upload album icon"
                    >
                      {uploadingIcon === album.id ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-white" />
                      )}
                    </label>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="admin-input flex-1 px-2 py-1 rounded"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameAlbum(album.id);
                          if (e.key === "Escape") {
                            setEditingAlbum(null);
                            setEditingTitle("");
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRenameAlbum(album.id)}
                        className="admin-icon-btn success"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAlbum(null);
                          setEditingTitle("");
                        }}
                        className="admin-icon-btn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium admin-text-primary">
                        {album.title}
                      </h3>
                      <p className="text-xs admin-text-muted">
                        /{album.slug} • {albumImages.length} images
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAlbum(album.id);
                        setEditingTitle(album.title);
                      }}
                      className="admin-icon-btn"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(album.id)}
                    className="admin-icon-btn danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Album Content (Expanded) */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Upload Area */}
                  <AlbumDropzone
                    albumId={album.id}
                    onDrop={onDrop}
                    isUploading={isUploading}
                  />

                  {/* Images Grid */}
                  {albumImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {albumImages.map((image) => (
                        <div
                          key={image.id}
                          className="group relative admin-image-card"
                        >
                          <div
                            className="aspect-square relative"
                            style={{
                              backgroundColor:
                                "color-mix(in oklab, var(--text) 5%, transparent)",
                            }}
                          >
                            <img
                              src={image.src}
                              alt={image.alt || ""}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="admin-image-overlay" />
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteImage(image.id, image.src)
                              }
                              className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{
                                backgroundColor:
                                  "color-mix(in oklab, var(--bg-app) 90%, transparent)",
                                color: "#ef4444",
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-3">
                            {editingImage === image.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingAlt}
                                  onChange={(e) =>
                                    setEditingAlt(e.target.value)
                                  }
                                  className="admin-input flex-1 px-2 py-1 text-xs rounded"
                                  placeholder="Image name"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleRenameImage(image.id);
                                    if (e.key === "Escape") {
                                      setEditingImage(null);
                                      setEditingAlt("");
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRenameImage(image.id)}
                                  className="admin-icon-btn success"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingImage(null);
                                    setEditingAlt("");
                                  }}
                                  className="admin-icon-btn"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <p
                                  className="text-xs admin-text-muted truncate flex-1"
                                  title={image.alt || "No name"}
                                >
                                  {image.alt || "No name"}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingImage(image.id);
                                    setEditingAlt(image.alt || "");
                                  }}
                                  className="admin-icon-btn opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center admin-text-muted py-8 text-sm">
                      No images in this album yet. Upload some!
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {albums.length === 0 && (
          <p className="text-center admin-text-muted py-8">
            No albums yet. Create one to get started!
          </p>
        )}
      </div>
    </div>
  );
}

// Separate component for dropzone to handle hooks properly
function AlbumDropzone({
  albumId,
  onDrop,
  isUploading,
}: {
  albumId: number;
  onDrop: (files: File[], albumId: number) => void;
  isUploading: boolean;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, albumId),
    accept: { "image/*": [] },
  });

  return (
    <div
      {...getRootProps()}
      className={cn("admin-dropzone", isDragActive && "active")}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader2
            className="w-8 h-8 animate-spin mb-2"
            style={{ color: "var(--text)", opacity: 0.4 }}
          />
          <p className="text-sm admin-text-muted">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload
            className="w-8 h-8 mb-2"
            style={{ color: "var(--text)", opacity: 0.4 }}
          />
          <p className="text-sm font-medium admin-text-primary">
            Drop images here, or click to select
          </p>
          <p className="text-xs admin-text-muted mt-1">
            Supports JPG, PNG, WebP
          </p>
        </div>
      )}
    </div>
  );
}
