"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Network, Terminal, FolderOpen, Database, Server, Play, Settings, Clock, Merge, Split } from "lucide-react"

interface ToolsGridProps {
  onToolSelect: (toolId: string) => void
}

const tools = [
  {
    icon: FolderOpen,
    title: "디렉토리 Listing",
    description: "지정된 폴더에서 .ini, .log, .txt 파일의 이름을 추출하여 목록을 생성합니다.",
    status: "ready",
    lastRun: "30분 전",
    color: "bg-blue-500",
  },
  {
    icon: Terminal,
    title: "SecureCRT 세션 생성",
    description: "IP 범위 또는 Hostname 목록으로 SecureCRT .ini 세션 파일을 생성합니다.",
    status: "ready",
    lastRun: "1시간 전",
    color: "bg-emerald-500",
  },
  {
    icon: Server,
    title: "모델/시리얼/호스트네임 추출",
    description: "로그에서 모델명, 시리얼번호, 호스트네임 등을 추출하여 엑셀로 정리합니다.",
    status: "ready",
    lastRun: "2시간 전",
    color: "bg-purple-500",
  },
  {
    icon: Merge,
    title: "로그 파일 병합",
    description: "여러 개의 로그 파일을 하나의 엑셀 파일로 병합합니다.",
    status: "ready",
    lastRun: "1시간 전",
    color: "bg-orange-500",
  },
  {
    icon: Split,
    title: "로그 파일 분산",
    description: "여러 시트의 엑셀 파일을 개별 텍스트 파일로 분산합니다.",
    status: "ready",
    lastRun: "3시간 전",
    color: "bg-cyan-500",
  },
  {
    icon: Network,
    title: "LLDP 포트 라벨",
    description: "Hostname/OUI 두 가지 탭으로 LLDP 포트 라벨을 생성합니다.",
    status: "ready",
    lastRun: "30분 전",
    color: "bg-indigo-500",
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "running":
      return <Badge className="bg-primary text-primary-foreground">실행 중</Badge>
    case "scheduled":
      return <Badge variant="secondary">예약됨</Badge>
    case "ready":
      return <Badge variant="outline">준비됨</Badge>
    default:
      return <Badge variant="outline">알수없음</Badge>
  }
}

export function ToolsGrid({ onToolSelect }: ToolsGridProps) {
  const toolsWithIds = tools.map((tool, index) => ({
    ...tool,
    id: `tool-${index}`,
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {toolsWithIds.map((tool) => (
        <Card key={tool.id} className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${tool.color} rounded-lg flex items-center justify-center`}>
                  <tool.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">{getStatusBadge(tool.status)}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <CardDescription className="text-sm leading-relaxed">{tool.description}</CardDescription>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  마지막 실행
                </span>
                <span className="font-medium">{tool.lastRun}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" size="sm" onClick={() => onToolSelect(tool.id)}>
                <Play className="w-4 h-4 mr-2" />
                실행
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
