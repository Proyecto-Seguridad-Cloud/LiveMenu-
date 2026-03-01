import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { categoriesService } from "../../services/categories";
import { ApiError } from "../../services/http";
import type { Category } from "../../types/category";

function SortableCategoryItem({
  category,
  onToggle,
  onEdit,
  onDelete,
}: {
  category: Category;
  onToggle: (c: Category) => void;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card p-3"
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{category.name}</p>
        {category.description && (
          <p className="text-sm text-muted-foreground truncate">
            {category.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={category.active ? "default" : "secondary"}>
          {category.active ? "Activa" : "Inactiva"}
        </Badge>
        <Switch
          checked={category.active}
          onCheckedChange={() => onToggle(category)}
        />
        <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(category.id)}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function CategoriesPage() {
  const { token } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantMissing, setRestaurantMissing] = useState(false);

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function loadCategories() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await categoriesService.list(token);
        setCategories(response);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setRestaurantMissing(true);
        } else {
          const msg =
            error instanceof Error
              ? error.message
              : "No fue posible cargar categorías";
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    }
    void loadCategories();
  }, [token]);

  function openCreateDialog() {
    setEditingCategory(null);
    setFormName("");
    setFormDescription("");
    setDialogOpen(true);
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || "");
    setDialogOpen(true);
  }

  async function handleSubmitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !formName.trim()) return;

    try {
      setSaving(true);
      if (editingCategory) {
        const updated = await categoriesService.update(
          token,
          editingCategory.id,
          {
            name: formName.trim(),
            description: formDescription.trim() || null,
          }
        );
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        toast.success("Categoría actualizada");
      } else {
        const created = await categoriesService.create(token, {
          name: formName.trim(),
          description: formDescription.trim() || null,
        });
        setCategories((prev) => [...prev, created]);
        toast.success("Categoría creada");
      }
      setDialogOpen(false);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "No fue posible guardar categoría";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(category: Category) {
    if (!token) return;
    try {
      const updated = await categoriesService.update(token, category.id, {
        active: !category.active,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Error al actualizar estado";
      toast.error(msg);
    }
  }

  async function handleConfirmDelete() {
    if (!token || !deleteId) return;
    try {
      await categoriesService.remove(token, deleteId);
      setCategories((prev) =>
        prev
          .filter((c) => c.id !== deleteId)
          .map((c, idx) => ({ ...c, position: idx + 1 }))
      );
      toast.success("Categoría eliminada");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Error al eliminar categoría";
      toast.error(msg);
    } finally {
      setDeleteId(null);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !token) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex).map(
      (c, idx) => ({ ...c, position: idx + 1 })
    );

    setCategories(reordered);

    try {
      const ordered = await categoriesService.reorder(
        token,
        reordered.map((c) => c.id)
      );
      setCategories(ordered);
      toast.success("Orden guardado");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Error al guardar orden";
      toast.error(msg);
      // Revert on error
      const response = await categoriesService.list(token);
      setCategories(response);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (restaurantMissing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
          <CardDescription>
            Primero debes crear tu restaurante para gestionar categorías.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/admin/restaurant">Ir a Mi Restaurante</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">
            Arrastra para reordenar. El orden se guarda automáticamente.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Agregar
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              Aún no hay categorías creadas.
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              Crear primera categoría
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {categories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  onToggle={handleToggle}
                  onEdit={openEditDialog}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar categoría" : "Nueva categoría"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="catName">Nombre</Label>
              <Input
                id="catName"
                placeholder="Ej: Entradas"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catDesc">Descripción</Label>
              <Input
                id="catDesc"
                placeholder="Opcional"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingCategory ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la categoría y
              todos los platos asociados perderán su categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
