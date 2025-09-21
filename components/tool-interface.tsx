"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Upload, Play, Download, FileText } from "lucide-react"

interface ToolInterfaceProps {
  toolId: string
  onBack: () => void
}

export function ToolInterface({ toolId, onBack }: ToolInterfaceProps) {
  const [isRunning, setIsRunning] = useState(false)
  // selection for ip/model/serial/hostname/image fields
  const [includeIp, setIncludeIp] = useState(true)
  const [includeModel, setIncludeModel] = useState(true)
  const [includeSerial, setIncludeSerial] = useState(true)
  const [includeHostname, setIncludeHostname] = useState(true)
  const [includeImage, setIncludeImage] = useState(true)
  const [includeImageSelected, setIncludeImageSelected] = useState(true)
  const [includeImageBooted, setIncludeImageBooted] = useState(true)
  // directory listing states (tool-0)
  const [directoryPath, setDirectoryPath] = useState("")
  const [dirIncludeIni, setDirIncludeIni] = useState(false)
  const [dirIncludeLog, setDirIncludeLog] = useState(true)
  const [dirIncludeTxt, setDirIncludeTxt] = useState(true)
  // securecrt hostname tab
  const [crtTemplate, setCrtTemplate] = useState<File | null>(null)
  const [crtHostList, setCrtHostList] = useState<File | null>(null)
  // securecrt ip range tab
  const [securecrtTab, setSecurecrtTab] = useState<"ip" | "hostname">("ip")
  const [ipTemplate, setIpTemplate] = useState<File | null>(null)
  const [ipLabels, setIpLabels] = useState<File | null>(null)
  const [startIp, setStartIp] = useState("")
  const [endIp, setEndIp] = useState("")
  // results
  const [results, setResults] = useState<string | null>(null)
  const [files, setFiles] = useState<FileList | null>(null)
  const [tableJson, setTableJson] = useState<any[] | null>(null)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

  const runExtract = async (mode: "json" | "excel") => {
    // Directory Listing
    if (toolId === "tool-0") {
      if (!directoryPath) {
        setResults("디렉토리 경로를 입력해주세요.")
        return
      }
      setIsRunning(true)
      setResults(null)
      setTableJson(null)
      try {
        const form = new FormData()
        form.append("directory", directoryPath)
        form.append("include_ini", String(dirIncludeIni))
        form.append("include_log", String(dirIncludeLog))
        form.append("include_txt", String(dirIncludeTxt))
        if (mode === "json") {
          const res = await fetch(`${API_BASE}/dir/list`, { method: "POST", body: form })
          if (!res.ok) throw new Error("디렉토리 목록 조회 실패")
          const data = await res.json()
          setTableJson(data)
          setResults("목록 로드 완료")
        } else {
          const res = await fetch(`${API_BASE}/dir/list/excel`, { method: "POST", body: form })
          if (!res.ok) throw new Error("디렉토리 목록 엑셀 생성 실패")
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          setResults(url)
        }
      } catch (e: any) {
        setResults(`에러: ${e.message}`)
      } finally {
        setIsRunning(false)
      }
      return
    }

    // SecureCRT (combined)
    if (toolId === "tool-1") {
      if (securecrtTab === "hostname") {
        if (!crtTemplate || !crtHostList) {
          setResults("템플릿 INI와 Hostname TXT를 모두 선택해주세요.")
          return
        }
        setIsRunning(true)
        setResults(null)
        setTableJson(null)
        try {
          const form = new FormData()
          form.append("template", crtTemplate)
          form.append("hostlist", crtHostList)
          if (mode === "json") {
            const res = await fetch(`${API_BASE}/securecrt/hostname/preview`, { method: "POST", body: form })
            if (!res.ok) throw new Error("미리보기 생성 실패")
            const data = await res.json()
            setTableJson(data)
            setResults("미리보기 로드 완료")
          } else {
            const res = await fetch(`${API_BASE}/securecrt/hostname/generate`, { method: "POST", body: form })
            if (!res.ok) throw new Error("ZIP 생성 실패")
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            setResults(url)
          }
        } catch (e: any) {
          setResults(`에러: ${e.message}`)
        } finally {
          setIsRunning(false)
        }
      } else {
        if (!ipTemplate || !ipLabels || !startIp || !endIp) {
          setResults("템플릿 INI, 라벨 TXT, 시작/종료 IP를 입력해주세요.")
          return
        }
        setIsRunning(true)
        setResults(null)
        setTableJson(null)
        try {
          const form = new FormData()
          form.append("template", ipTemplate)
          form.append("labels", ipLabels)
          form.append("start_ip", startIp)
          form.append("end_ip", endIp)
          if (mode === "json") {
            const res = await fetch(`${API_BASE}/securecrt/iprange/preview`, { method: "POST", body: form })
            if (!res.ok) throw new Error("미리보기 생성 실패")
            const data = await res.json()
            if (Array.isArray(data)) {
              setTableJson(data)
              setResults("미리보기 로드 완료")
            } else if (data && (data as any).error) {
              setResults(String((data as any).error))
            } else {
              setResults("알 수 없는 응답")
            }
          } else {
            const res = await fetch(`${API_BASE}/securecrt/iprange/generate`, { method: "POST", body: form })
            if (!res.ok) throw new Error("ZIP 생성 실패")
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            setResults(url)
          }
        } catch (e: any) {
          setResults(`에러: ${e.message}`)
        } finally {
          setIsRunning(false)
        }
      }
      return
    }

    // Default: 모델/시리얼/호스트네임 추출
    if (!files || files.length === 0) {
      setResults("파일을 선택해주세요.")
      return
    }
    setIsRunning(true)
    setResults(null)
    setTableJson(null)
    try {
      const form = new FormData()
      Array.from(files).forEach((f) => form.append("files", f))
      form.append("include_ip", String(includeIp))
      form.append("include_model", String(includeModel))
      form.append("include_serial", String(includeSerial))
      form.append("include_hostname", String(includeHostname))
      form.append("include_image", String(includeImage))
      form.append("include_image_selected", String(includeImageSelected))
      form.append("include_image_booted", String(includeImageBooted))

      if (mode === "json") {
        const res = await fetch(`${API_BASE}/extract/json`, { method: "POST", body: form })
        if (!res.ok) throw new Error("JSON 추출 실패")
        const data = await res.json()
        setTableJson(data)
        setResults("JSON 미리보기 로드 완료")
      } else {
        const res = await fetch(`${API_BASE}/extract/excel`, { method: "POST", body: form })
        if (!res.ok) throw new Error("엑셀 추출 실패")
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setResults(url)
      }
    } catch (e: any) {
      setResults(`에러: ${e.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const renderToolInterface = () => {
    switch (toolId) {
      case "tool-0":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="directory">디렉토리 경로</Label>
              <Input id="directory" placeholder="C:\\logs" value={directoryPath} onChange={(e) => setDirectoryPath(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="ini" checked={dirIncludeIni} onCheckedChange={(v) => setDirIncludeIni(!!v)} />
              <Label htmlFor="ini">.ini 파일</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="log" checked={dirIncludeLog} onCheckedChange={(v) => setDirIncludeLog(!!v)} />
              <Label htmlFor="log">.log 파일</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="txt" checked={dirIncludeTxt} onCheckedChange={(v) => setDirIncludeTxt(!!v)} />
              <Label htmlFor="txt">.txt 파일</Label>
            </div>
          </div>
        )
      case "tool-1":
        return (
          <div className="space-y-4">
            <Tabs value={securecrtTab} onValueChange={(v) => setSecurecrtTab(v as any)}>
              <TabsList>
                <TabsTrigger value="ip">IP Range</TabsTrigger>
                <TabsTrigger value="hostname">Hostname</TabsTrigger>
              </TabsList>
              <TabsContent value="ip">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ip-template">템플릿 INI</Label>
                    <div className="flex items-center gap-2">
                      <Input id="ip-template" type="file" accept=".ini" onChange={(e) => setIpTemplate(e.target.files?.[0] ?? null)} />
                      <Button variant="outline" size="icon">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ip-labels">라벨 TXT</Label>
                    <div className="flex items-center gap-2">
                      <Input id="ip-labels" type="file" accept=".txt" onChange={(e) => setIpLabels(e.target.files?.[0] ?? null)} />
                      <Button variant="outline" size="icon">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-ip">시작 IP</Label>
                      <Input id="start-ip" placeholder="192.168.1.1" value={startIp} onChange={(e) => setStartIp(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="end-ip">종료 IP</Label>
                      <Input id="end-ip" placeholder="192.168.1.100" value={endIp} onChange={(e) => setEndIp(e.target.value)} />
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="hostname">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hostname-file">호스트명 파일 업로드</Label>
                    <div className="flex items-center gap-2">
                      <Input id="hostname-file" type="file" multiple accept=".ini,.txt" onChange={(e) => {
                        const files = Array.from(e.target.files ?? [])
                        const ini = files.find(f => f.name.toLowerCase().endsWith('.ini')) || null
                        const txt = files.find(f => f.name.toLowerCase().endsWith('.txt')) || null
                        // @ts-ignore
                        setCrtTemplate(ini as any)
                        // @ts-ignore
                        setCrtHostList(txt as any)
                      }} />
                      <Button variant="outline" size="icon">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )
      case "tool-2":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="log-files">로그 파일 선택</Label>
              <div className="flex items-center gap-2">
                <Input id="log-files" type="file" multiple accept=".log,.txt" onChange={(e) => setFiles(e.target.files)} />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )
      case "tool-3":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="merge-files">병합할 파일 선택</Label>
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
      case "tool-4":
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
      case "tool-5":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lldp-files">LLDP 로그 파일</Label>
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
      case "tool-6":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lldp-oui-files">LLDP 로그 파일</Label>
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
      "SecureCRT 세션 생성",
      "모델/시리얼/호스트네임 추출",
      "로그 파일 병합",
      "로그 파일 분산",
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
              <CardDescription>도구 실행에 필요한 매개변수를 설정하세요</CardDescription>
            </CardHeader>
            <CardContent>
              {renderToolInterface()}

              {toolId === "tool-2" && (
                <div className="space-y-3 mt-3">
                  <Label>추출 항목 선택</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="model" checked={includeModel} onCheckedChange={(v) => setIncludeModel(!!v)} />
                      <Label htmlFor="model">모델명</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="serial" checked={includeSerial} onCheckedChange={(v) => setIncludeSerial(!!v)} />
                      <Label htmlFor="serial">시리얼번호</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hostname" checked={includeHostname} onCheckedChange={(v) => setIncludeHostname(!!v)} />
                      <Label htmlFor="hostname">호스트네임</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="ip" checked={includeIp} onCheckedChange={(v) => setIncludeIp(!!v)} />
                      <Label htmlFor="ip">IP</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="image" checked={includeImage} onCheckedChange={(v) => setIncludeImage(!!v)} />
                      <Label htmlFor="image">Image 버전</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="image-selected" checked={includeImageSelected} onCheckedChange={(v) => setIncludeImageSelected(!!v)} />
                      <Label htmlFor="image-selected">Image Selected</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="image-booted" checked={includeImageBooted} onCheckedChange={(v) => setIncludeImageBooted(!!v)} />
                      <Label htmlFor="image-booted">Image Booted</Label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-6">
                <Button onClick={() => runExtract("json")} disabled={isRunning} className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  {isRunning ? "실행 중..." : "미리보기(JSON)"}
                </Button>
                <Button variant="outline" onClick={() => runExtract("excel")} disabled={isRunning}>
                  <FileText className="w-4 h-4 mr-2" />
                  {toolId === "tool-1" ? "ZIP 다운로드" : toolId === "tool-0" ? "엑셀 다운로드" : "엑셀 다운로드"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>실행 결과</CardTitle>
              <CardDescription>도구 실행 상태 및 결과를 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              {isRunning ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">처리 중...</p>
                </div>
              ) : tableJson ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800">JSON 미리보기 로드 완료</p>
                  </div>
                  <div className="overflow-auto max-h-[420px] border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-card">
                        <tr>
                          {Object.keys(tableJson[0] || {}).map((k) => (
                            <th key={k} className="text-left p-2 border-b">
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableJson.map((row, idx) => (
                          <tr key={idx} className="odd:bg-muted/40">
                            {Object.keys(tableJson[0] || {}).map((k) => (
                              <td key={k} className="p-2 border-b">
                                {String(row[k] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : typeof results === "string" && results.startsWith("blob:") ? (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800">다운로드 파일이 준비되었습니다.</p>
                  </div>
                  <a
                    href={results}
                    download={toolId === "tool-1" ? "securecrt-sessions.zip" : toolId === "tool-0" ? "directory-listing.xlsx" : "hostname-serial.xlsx"}
                    className="inline-flex items-center justify-center w-full border rounded-md py-2"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    결과 다운로드
                  </a>
                </div>
              ) : results ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{results}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">파일을 올린 뒤 실행하세요</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

