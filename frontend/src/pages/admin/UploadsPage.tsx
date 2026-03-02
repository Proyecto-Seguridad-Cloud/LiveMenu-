import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { Upload, Trash2, Copy, Loader2, ExternalLink, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "../../context/AuthContext";
import { uploadsService } from "../../services/uploads";
import type { UploadImageResponse } from "../../types/upload";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VARIANT_ORDER = ["thumbnail", "medium", "large"];

export function UploadsPage() {
  const { token } = useAuth();

  const [uploads, setUploads] = useState<UploadImageResponse[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const authToken = token;

    let isMounted = true;

    async function loadImages() {
      try {
        setLoadingUploads(true);
        const images = await uploadsService.listImages(authToken);
        if (isMounted) {
          setUploads(images);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(
            error instanceof Error ? error.message : "Error al cargar imágenes"
          );
        }
      } finally {
        if (isMounted) {
          setLoadingUploads(false);
        }
      }
    }

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleSelectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !token) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Tipo no permitido. Usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`El archivo supera el límite de ${MAX_SIZE_MB}MB.`);
      return;
    }

    try {
      setUploading(true);
      const response = await uploadsService.uploadImage(token, file);
      setUploads((prev) => [response, ...prev]);
      toast.success("Imagen subida correctamente");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al subir imagen"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!token || !deleteFileId) return;
    try {
      setDeleting(true);
      await uploadsService.deleteImage(token, deleteFileId);
      setUploads((prev) => prev.filter((u) => u.file_id !== deleteFileId));
      toast.success("Imagen eliminada");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar imagen"
      );
    } finally {
      setDeleting(false);
      setDeleteFileId(null);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copiada al portapapeles");
    } catch {
      toast.error("No fue posible copiar la URL");
    }
  }

  function getPreviewUrl(urls: Record<string, string>): string {
    return (
      urls.thumbnail ||
      urls.medium ||
      urls.large ||
      Object.values(urls)[0] ||
      ""
    );
  }

  function getOrderedVariants(urls: Record<string, string>) {
    return Object.entries(urls).sort(([a], [b]) => {
      const aIndex = VARIANT_ORDER.indexOf(a);
      const bIndex = VARIANT_ORDER.indexOf(b);
      const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      return safeA - safeB;
    });
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight sm:text-[24px]">
          Gestión de Imágenes
        </h1>
        <p className="text-sm text-muted-foreground">
          Subida de JPG/PNG/WebP con máximo 5MB.
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="pt-6">
          <div className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/30 p-6 text-center transition-colors hover:bg-secondary/60 sm:p-10">
            <Upload className="mb-3 size-8 text-primary" />
            <p className="text-base font-semibold">Zona de carga</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Selecciona una imagen para generar variantes thumbnail, medium y
              large.
            </p>
            <Button asChild disabled={uploading}>
              {uploading ? (
                <span>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Subiendo...
                </span>
              ) : (
                <label className="cursor-pointer">
                  Seleccionar archivo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={handleSelectFile}
                    className="hidden"
                  />
                </label>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Images */}
      {loadingUploads ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Cargando imágenes...
          </CardContent>
        </Card>
      ) : uploads.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no hay imágenes subidas.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {uploads.map((item) => {
            const previewUrl = getPreviewUrl(item.urls);
            const variants = getOrderedVariants(item.urls);

            return (
              <Card key={item.file_id}>
                <CardContent className="pt-5">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold">
                          {item.original_filename}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteFileId(item.file_id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {previewUrl && (
                      <div className="rounded-xl border bg-background p-3">
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-xl border bg-secondary/30"
                        >
                          <img
                            src={previewUrl}
                            alt={item.original_filename}
                            className="h-36 w-full object-cover"
                            loading="lazy"
                          />
                        </a>
                      </div>
                    )}

                    <details className="group rounded-xl border bg-background">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                        <span>Tamaños y links</span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {variants.length} variante{variants.length > 1 ? "s" : ""}
                          </span>
                          <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
                        </span>
                      </summary>

                      <div className="space-y-3 border-t p-3">
                        {variants.map(([variant, url]) => (
                          <div
                            key={variant}
                            className="rounded-xl border bg-background p-3"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <Badge variant="secondary">{variant}</Badge>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyUrl(url)}
                                  aria-label={`Copiar URL ${variant}`}
                                >
                                  <Copy className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Abrir URL ${variant}`}
                                  >
                                    <ExternalLink className="size-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="block break-all text-xs text-muted-foreground hover:text-foreground"
                            >
                              {url}
                            </a>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteFileId !== null}
        onOpenChange={(open) => !open && setDeleteFileId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todas las variantes (thumbnail, medium, large).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
