import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Cpu, HardDrive, Wifi } from "lucide-react"

export function StatusBar() {
  return (
    <Card className="w-80">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Cpu className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CPU</p>
              <p className="text-sm font-medium">23%</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">메모리</p>
              <p className="text-sm font-medium">67%</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-chart-2/10 rounded-lg flex items-center justify-center">
              <Wifi className="w-4 h-4 text-chart-2" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">네트워크</p>
              <Badge variant="secondary" className="text-xs px-1 py-0">
                정상
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-chart-4/10 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">작업</p>
              <p className="text-sm font-medium">3개</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
