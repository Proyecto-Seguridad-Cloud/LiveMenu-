import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Download, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '../../context/AuthContext'
import { analyticsService } from '../../services/analytics'
import type { AnalyticsSummary } from '../../types/analytics'

export function AnalyticsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function load() {
      if (!token) return
      try {
        const summary = await analyticsService.getSummary(token)
        setData(summary)
      } catch {
        toast.error('No se pudieron cargar las analíticas')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [token])

  const maxCount = useMemo(
    () => Math.max(...(data?.daily_breakdown.map((d) => d.count) ?? [0]), 1),
    [data],
  )

  async function handleExportCsv() {
    if (!token) return
    try {
      setExporting(true)
      const blob = await analyticsService.exportCsv(token)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'analytics.csv'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success('CSV exportado correctamente')
    } catch {
      toast.error('No fue posible exportar analíticas')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-[22px] font-bold tracking-tight sm:text-[24px]">Analíticas</h1>
        <p className="text-sm text-muted-foreground">No hay datos disponibles aún.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight sm:text-[24px]">Analíticas</h1>
        <p className="text-sm text-muted-foreground">Métricas de escaneos del menú público.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total escaneos</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.total_scans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Últimos 7 días</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.scans_last_7_days}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Últimos 30 días</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.scans_last_30_days}</div>
          </CardContent>
        </Card>
      </div>

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
            <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay escaneos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex h-44 min-w-max items-end gap-1 rounded-xl border bg-secondary/20 p-2">
                {data.daily_breakdown.map((item) => (
                  <div key={item.day} className="group relative h-full w-3 shrink-0 sm:w-4">
                    <div
                      className="absolute bottom-0 w-full rounded-sm bg-primary/80 transition-colors group-hover:bg-primary"
                      style={{
                        height: `${(item.count / maxCount) * 100}%`,
                        minHeight: item.count > 0 ? '4px' : '0px',
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
    </div>
  )
}