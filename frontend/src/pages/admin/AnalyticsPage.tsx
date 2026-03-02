import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Clock,
  Download,
  Eye,
  Loader2,
  Monitor,
  MousePointerClick,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../context/AuthContext";
import { analyticsService } from "../../services/analytics";
import type { AnalyticsSummary } from "../../types/analytics";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const DEVICE_ICONS: Record<string, typeof Smartphone> = {
  Mobile: Smartphone,
  Desktop: Monitor,
  Tablet: Tablet,
};

export function AnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const summary = await analyticsService.getSummary(token);
        setData(summary);
      } catch {
        toast.error("No se pudieron cargar las analíticas");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token]);

  const maxCount = useMemo(
    () => Math.max(...(data?.daily_breakdown.map((d) => d.count) ?? [0]), 1),
    [data]
  );

  async function handleExportCsv() {
    if (!token) return;
    try {
      setExporting(true);
      const blob = await analyticsService.exportCsv(token);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "analytics.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV exportado correctamente");
    } catch {
      toast.error("No fue posible exportar analíticas");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-[22px] font-bold tracking-tight sm:text-[24px]">Analíticas</h1>
        <p className="text-sm text-muted-foreground">No hay datos disponibles aún.</p>
      </div>
    );
  }

  const maxHourlyCount = Math.max(...data.hourly_breakdown.map((d) => d.count), 1);
  const maxWeekdayCount = Math.max(...data.weekday_breakdown.map((d) => d.count), 1);
  const totalDevices = data.device_breakdown.reduce((s, d) => s + d.count, 0) || 1;
  const totalReferrers = data.referrer_breakdown.reduce((s, d) => s + d.count, 0) || 1;
  const totalNewRet = data.new_visitors + data.returning_visitors || 1;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight sm:text-[24px]">Analíticas</h1>
        <p className="text-sm text-muted-foreground">
          Métricas de escaneos del menú público (últimos 30 días).
        </p>
      </div>

      {/* Top metric cards */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total escaneos
            </CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.total_scans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Últimos 7 días
            </CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.scans_last_7_days}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Últimos 30 días
            </CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.scans_last_30_days}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visitantes únicos
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.unique_visitors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily chart */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Escaneos por día (últimos 30 días)</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Exportar CSV
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {data.daily_breakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay escaneos registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex h-44 min-w-max items-end gap-1 rounded-xl border bg-secondary/20 p-2">
                {data.daily_breakdown.map((item) => (
                  <div key={item.day} className="group relative h-full w-3 shrink-0 sm:w-4">
                    <div
                      className="absolute bottom-0 w-full rounded-sm bg-primary/80 transition-colors group-hover:bg-primary"
                      style={{
                        height: `${(item.count / maxCount) * 100}%`,
                        minHeight: item.count > 0 ? "4px" : "0px",
                      }}
                    />
                    <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
                      {item.day}: {item.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-column grid: New vs Returning + Devices */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {/* New vs Returning */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevos vs Recurrentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex h-6 overflow-hidden rounded-full">
              <div
                className="bg-orange-500 transition-all"
                style={{ width: `${(data.new_visitors / totalNewRet) * 100}%` }}
              />
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${(data.returning_visitors / totalNewRet) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="inline-block size-3 rounded-full bg-orange-500" />
                Nuevos: {data.new_visitors}
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block size-3 rounded-full bg-blue-500" />
                Recurrentes: {data.returning_visitors}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Device breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dispositivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.device_breakdown.map((d) => {
              const Icon = DEVICE_ICONS[d.device] || Monitor;
              const pct = Math.round((d.count / totalDevices) * 100);
              return (
                <div key={d.device} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      {d.device}
                    </span>
                    <span className="text-muted-foreground">
                      {d.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.device_breakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-column: Traffic sources + Peak hours */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {/* Traffic sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fuentes de tráfico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.referrer_breakdown.map((r) => {
              const pct = Math.round((r.count / totalReferrers) * 100);
              return (
                <div key={r.source} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{r.source}</span>
                    <span className="text-muted-foreground">
                      {r.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.referrer_breakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            )}
          </CardContent>
        </Card>

        {/* Peak hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horas pico</CardTitle>
          </CardHeader>
          <CardContent>
            {data.hourly_breakdown.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Sin datos</p>
            ) : (
              <div className="flex items-end gap-[2px] h-32">
                {Array.from({ length: 24 }, (_, h) => {
                  const item = data.hourly_breakdown.find((i) => i.hour === h);
                  const count = item?.count ?? 0;
                  return (
                    <div
                      key={h}
                      className="group relative flex-1"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="absolute bottom-0 w-full rounded-t bg-violet-500 transition-colors group-hover:bg-violet-600"
                        style={{
                          height: `${(count / maxHourlyCount) * 100}%`,
                          minHeight: count > 0 ? "2px" : "0px",
                        }}
                      />
                      <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:block whitespace-nowrap">
                        {h}:00 — {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>0h</span>
              <span>6h</span>
              <span>12h</span>
              <span>18h</span>
              <span>23h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day of week */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Día de la semana</CardTitle>
        </CardHeader>
        <CardContent>
          {data.weekday_breakdown.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sin datos</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {Array.from({ length: 7 }, (_, dow) => {
                const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
                const item = data.weekday_breakdown.find((i) => i.weekday === dow);
                const count = item?.count ?? 0;
                return (
                  <div key={dow} className="flex flex-1 flex-col items-center gap-1">
                    <div className="relative w-full flex-1 min-h-[80px]">
                      <div
                        className="absolute bottom-0 w-full rounded-t bg-amber-500"
                        style={{
                          height: `${(count / maxWeekdayCount) * 100}%`,
                          minHeight: count > 0 ? "4px" : "0px",
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {labels[dow]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactions grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duración promedio
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatDuration(data.avg_session_duration_seconds)}
            </div>
            <p className="text-xs text-muted-foreground">min:seg por sesión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profundidad de scroll
            </CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.avg_scroll_depth}%</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{ width: `${Math.min(data.avg_scroll_depth, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            ) : (
              <ol className="space-y-1">
                {data.top_categories.slice(0, 5).map((c, i) => (
                  <li key={c.name} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                      {c.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top platos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_dishes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            ) : (
              <ol className="space-y-1">
                {data.top_dishes.slice(0, 5).map((d, i) => (
                  <li key={d.name} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                      {d.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{d.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
