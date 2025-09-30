"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Network, Terminal, FolderOpen, Server, Play, Merge, Split, Table } from "lucide-react"

interface ToolsGridProps {
  onToolSelect: (toolId: string) => void
}

const tools = [
  {
    icon: FolderOpen,
    title: "디렉토리 Listing",
    description: "지정된 폴더를 ZIP으로 올려 내부 .ini/.log/.txt 목록을 생성합니다.",
    status: "ready",
    color: "bg-blue-500",
  },
  {
    icon: Terminal,
    title: "SecureCRT 세션 생성",
    description: "IP 범위 또는 Hostname 목록으로 SecureCRT .ini 세션 파일을 생성합니다.",
    status: "ready",
    color: "bg-emerald-500",
  },
  {
    icon: Server,
    title: "모델/시리얼/호스트네임 추출",
    description: "네트워크 장비 로그에서 모델명, 시리얼번호, 호스트네임 등을 추출합니다.",
    status: "ready",
    color: "bg-purple-500",
  },
  {
    icon: Merge,
    title: "로그 파일 병합",
    description: "여러 로그 파일을 하나의 엑셀 파일로 병합합니다.",
    status: "ready",
    color: "bg-orange-500",
  },
  {
    icon: Split,
    title: "로그 파일 분산",
    description: "엑셀 파일을 시트별 텍스트 파일(.txt/.log)로 분산합니다.",
    status: "ready",
    color: "bg-cyan-500",
  },
  {
    icon: Network,
    title: "LLDP 포트 추출",
    description: "show lldp neighbors 결과에서 포트 정보를 추출합니다.",
    status: "ready",
    color: "bg-indigo-500",
  },
  {
    icon: Table,
    title: "Excel 시트 비교",
    description: "한 엑셀 파일 내 두 시트를 선택해 행/열 차이를 확인합니다.",
    status: "ready",
    color: "bg-teal-500",
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
              
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <CardDescription className="text-sm leading-relaxed">{tool.description}</CardDescription>

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

