"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Upload, Play, Download, FileText } from "lucide-react"

interface ToolInterfaceProps {
  toolId: string
  onBack: () => void
}

export function ToolInterface({ toolId, onBack }: ToolInterfaceProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<string | null>(null)

  const handleRun = async () => {
    setIsRunning(true)
    // Simulate processing
    setTimeout(() => {
      setIsRunning(false)
      setResults("작업이 성공적으로 완료되었습니다.")
    }, 3000)
  }

  const renderToolInterface = () => {
    switch (toolId) {
      case "tool-0": // 디렉토리 Listing
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="directory">디렉토리 경로</Label>
              <Input id="directory" placeholder="C:\logs" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="ini" />
              <Label htmlFor="ini">.ini 파일</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="log" defaultChecked />
              <Label htmlFor="log">.log 파일</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="txt" defaultChecked />
              <Label htmlFor="txt">.txt 파일</Label>
            </div>
          </div>
        )

      case "tool-1": // SecureCRT 세션 생성 (IP Range)
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-ip">시작 IP</Label>
                <Input id="start-ip" placeholder="192.168.1.1" />
              </div>
              <div>
                <Label htmlFor="end-ip">종료 IP</Label>
                <Input id="end-ip" placeholder="192.168.1.100" />
              </div>
            </div>
            <div>
              <Label htmlFor="username">사용자명</Label>
              <Input id="username" placeholder="admin" />
            </div>
            <div>
              <Label htmlFor="port">포트</Label>
              <Input id="port" placeholder="22" />
            </div>
            <div>
              <Label htmlFor="protocol">프로토콜</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="SSH2" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ssh2">SSH2</SelectItem>
                  <SelectItem value="telnet">Telnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "tool-2": // SecureCRT 세션 생성 (Hostname)
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hostname-file">호스트네임 파일 업로드</Label>
              <div className="flex items-center gap-2">
                <Input id="hostname-file" type="file" accept=".txt" />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="username2">사용자명</Label>
              <Input id="username2" placeholder="admin" />
            </div>
            <div>
              <Label htmlFor="port2">포트</Label>
              <Input id="port2" placeholder="22" />
            </div>
          </div>
        )

      case "tool-3": // 모델/시리얼/호스트네임 추출
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="log-files">로그 파일들 선택</Label>
              <div className="flex items-center gap-2">
                <Input id="log-files" type="file" multiple accept=".log,.txt" />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="model" defaultChecked />
              <Label htmlFor="model">모델명 추출</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="serial" defaultChecked />
              <Label htmlFor="serial">시리얼 번호 추출</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="hostname" defaultChecked />
              <Label htmlFor="hostname">호스트네임 추출</Label>
            </div>
          </div>
        )

      case "tool-4": // 로그파일 병합
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="merge-files">병합할 파일들 선택</Label>
              <div className="flex items-center gap-2">
                <Input id="merge-files" type="file" multiple accept=".log,.txt" />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="output-name">출력 파일명</Label>
              <Input id="output-name" placeholder="merged_logs.xlsx" />
            </div>
          </div>
        )

      case "tool-5": // 로그파일 분산
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="excel-file">엑셀 파일 업로드</Label>
              <div className="flex items-center gap-2">
                <Input id="excel-file" type="file" accept=".xlsx,.xls" />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="output-format">출력 형식</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="텍스트 파일" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">텍스트 파일 (.txt)</SelectItem>
                  <SelectItem value="log">로그 파일 (.log)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "tool-6": // LLDP 포트라벨 추출 (Hostname)
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lldp-files">LLDP 로그 파일들</Label>
              <div className="flex items-center gap-2">
                <Input id="lldp-files" type="file" multiple accept=".log,.txt" />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="hostname-pattern">호스트네임 패턴</Label>
              <Input id="hostname-pattern" placeholder="SW-*" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="include-description" />
              <Label htmlFor="include-description">포트 설명 포함</Label>
            </div>
          </div>
        )

      case "tool-7": // LLDP 포트라벨 추출 (OUI)
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lldp-oui-files">LLDP 로그 파일들</Label>
              <div className="flex items-center gap-2">
                <Input id="lldp-oui-files" type="file" multiple accept=".log,.txt" />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="oui-filter">OUI 필터</Label>
              <Textarea id="oui-filter" placeholder="00:1B:21 (Cisco)&#10;00:04:96 (HP)" rows={3} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="auto-detect" defaultChecked />
              <Label htmlFor="auto-detect">자동 OUI 감지</Label>
            </div>
          </div>
        )

      default:
        return <div>도구를 선택해주세요.</div>
    }
  }

  const getToolTitle = () => {
    const titles = [
      "디렉토리 Listing",
      "SecureCRT 세션 생성 (IP Range)",
      "SecureCRT 세션 생성 (Hostname)",
      "모델/시리얼/호스트네임 추출",
      "로그파일 병합",
      "로그파일 분산",
      "LLDP 포트라벨 추출 (Hostname)",
      "LLDP 포트라벨 추출 (OUI)",
    ]
    const index = Number.parseInt(toolId.split("-")[1])
    return titles[index] || "도구"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{getToolTitle()}</h1>
          <p className="text-muted-foreground mt-1">도구 설정 및 실행</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>설정</CardTitle>
              <CardDescription>도구 실행에 필요한 매개변수를 설정하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderToolInterface()}

              <div className="flex gap-2 pt-6">
                <Button onClick={handleRun} disabled={isRunning} className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  {isRunning ? "실행 중..." : "실행"}
                </Button>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  미리보기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>실행 결과</CardTitle>
              <CardDescription>도구 실행 상태 및 결과를 확인하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              {isRunning ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">처리 중...</p>
                </div>
              ) : results ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800">{results}</p>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    결과 다운로드
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">실행 버튼을 클릭하여 도구를 실행하세요.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
