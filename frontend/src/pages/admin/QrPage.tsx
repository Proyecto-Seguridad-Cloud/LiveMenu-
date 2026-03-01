import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Download, Copy, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../context/AuthContext";
import { restaurantService } from "../../services/restaurant";

export function QrPage() {
  const { token } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [restaurantMissing, setRestaurantMissing] = useState(false);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");

  const menuUrl = restaurantSlug
    ? `${window.location.origin}/m/${restaurantSlug}`
    : "";

  useEffect(() => {
    async function loadSlug() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const restaurant = await restaurantService.getCurrent(token);
        setRestaurantSlug(restaurant.slug);
      } catch {
        setRestaurantMissing(true);
      } finally {
        setLoading(false);
      }
    }
    void loadSlug();
  }, [token]);

  const handleDownloadPng = useCallback(() => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `menu-${restaurantSlug}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR descargado (PNG)");
  }, [restaurantSlug]);

  const handleDownloadSvg = useCallback(() => {
    const svgElement = svgRef.current?.querySelector("svg");
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = `menu-${restaurantSlug}-qr.svg`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
    toast.success("QR descargado (SVG)");
  }, [restaurantSlug]);

  async function handleCopyUrl() {
    if (!menuUrl) return;
    try {
      await navigator.clipboard.writeText(menuUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No fue posible copiar el enlace");
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
          <CardTitle>Mi Código QR</CardTitle>
          <CardDescription>
            Debes crear tu restaurante antes de generar el código QR.
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Código QR</h1>
        <p className="text-muted-foreground">
          Descarga e imprime el QR para que tus clientes accedan al menú.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Preview */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div ref={qrRef} className="rounded-xl border p-6" style={{ backgroundColor: bgColor }}>
              <QRCodeCanvas
                value={menuUrl}
                size={220}
                level="H"
                includeMargin={false}
                fgColor={fgColor}
                bgColor={bgColor}
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Escanea para abrir el menú
            </p>
            {/* Hidden SVG for download */}
            <div ref={svgRef} className="hidden">
              <QRCodeSVG
                value={menuUrl}
                size={800}
                level="H"
                fgColor={fgColor}
                bgColor={bgColor}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opciones</CardTitle>
            <CardDescription>
              URL del menú:{" "}
              <code className="text-xs break-all">{menuUrl}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color customization */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Color del código
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border"
                  />
                  <span className="text-xs text-muted-foreground">{fgColor}</span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Color de fondo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 w-12 cursor-pointer rounded border"
                  />
                  <span className="text-xs text-muted-foreground">{bgColor}</span>
                </div>
              </div>
            </div>
            {(fgColor !== "#000000" || bgColor !== "#FFFFFF") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFgColor("#000000");
                  setBgColor("#FFFFFF");
                }}
              >
                <RotateCcw className="mr-2 size-3" />
                Restablecer colores
              </Button>
            )}

            {/* Download & actions */}
            <Button className="w-full" onClick={handleDownloadPng}>
              <Download className="mr-2 size-4" />
              Descargar QR (PNG)
            </Button>
            <Button variant="outline" className="w-full" onClick={handleDownloadSvg}>
              <Download className="mr-2 size-4" />
              Descargar QR (SVG)
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyUrl}
            >
              <Copy className="mr-2 size-4" />
              Copiar enlace del menú
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href={menuUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-4" />
                Abrir menú en nueva pestaña
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
