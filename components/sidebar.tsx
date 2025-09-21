"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Network, Terminal, FolderOpen, Database, Settings, Server, Home, Wifi, Split, Merge } from "lucide-react"

const sidebarItems = [
  { id: "dashboard", icon: Home, label: "대시보드", active: true },
  { id: "tool-0", icon: FolderOpen, label: "디렉토리 Listing", active: false },
  { id: "tool-1", icon: Terminal, label: "SecureCRT 세션 생성", active: false },
  { id: "tool-2", icon: Database, label: "모델/시리얼/호스트네임 추출", active: false },
  { id: "tool-3", icon: Merge, label: "로그파일 병합", active: false },
  { id: "tool-4", icon: Split, label: "로그파일 분산", active: false },
  { id: "tool-5", icon: Network, label: "LLDP 포트 라벨", active: false },
  { id: "settings", icon: Settings, label: "설정", active: false },
]

interface SidebarProps {
  activeMenu: string
  onMenuSelect: (menuId: string) => void
}

export function Sidebar({ activeMenu, onMenuSelect }: SidebarProps) {
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">NetTools</h2>
            <p className="text-xs text-muted-foreground">v1.0.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => (
          <Button
            key={item.id}
            variant={activeMenu === item.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-11",
              activeMenu === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            onClick={() => onMenuSelect(item.id)}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Button>
        ))}
      </nav>
    </div>
  )
}
