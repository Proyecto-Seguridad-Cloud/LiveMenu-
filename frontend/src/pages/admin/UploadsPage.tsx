import type { ChangeEvent } from "react";
import { useState } from "react";
import { Upload, Trash2, Copy, Loader2 } from "lucide-react";
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

export function UploadsPage() {
  const { token } = useAuth();

  const [uploads, setUploads] = useState<UploadImageResponse[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Gestión de Imágenes
        </h1>
        <p className="text-muted-foreground">
          Subida de JPG/PNG/WebP con máximo 5MB.
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-orange-200 p-10 text-center">
            <Upload className="mb-3 size-8 text-muted-foreground" />
            <p className="font-semibold">Zona de carga</p>
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
      {uploads.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aún no hay imágenes cargadas en esta sesión.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {uploads.map((item) => (
            <Card key={item.file_id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {item.original_filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {item.file_id}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteFileId(item.file_id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  {Object.entries(item.urls).map(([variant, url]) => (
                    <div
                      key={variant}
                      className="flex items-center justify-between gap-3 rounded-md border p-2"
                    >
                      <Badge variant="secondary">{variant}</Badge>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 truncate text-xs text-muted-foreground hover:text-foreground"
                      >
                        {url}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyUrl(url)}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
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
