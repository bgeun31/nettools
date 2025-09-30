"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  // unified upload handled via single input (tool-2)
  // directory listing states (tool-0)
  const [directoryPath, setDirectoryPath] = useState("") // legacy (unused in zip mode)
  const [dirZip, setDirZip] = useState<File | null>(null)
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
  // merge files (tool-3)
  const [mergeFiles, setMergeFiles] = useState<FileList | null>(null)
  const [mergeOutputName, setMergeOutputName] = useState("merged_logs.xlsx")
  // distribute files (tool-4)
  const [distExcel, setDistExcel] = useState<File | null>(null)
  const [distFormat, setDistFormat] = useState<"txt" | "log">("txt")
  // LLDP 포트 추출 (tool-5)
  const [lldpFiles, setLldpFiles] = useState<FileList | null>(null)
  const [lldpPattern, setLldpPattern] = useState("")
  const [lldpIncludeDesc, setLldpIncludeDesc] = useState(false)
  // results
  const [results, setResults] = useState<string | null>(null)
  const [files, setFiles] = useState<FileList | null>(null)
  const [tableJson, setTableJson] = useState<any[] | null>(null)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
  // Excel sheet diff (tool-6)
  const [diffExcel, setDiffExcel] = useState<File | null>(null)
  const [diffSheets, setDiffSheets] = useState<string[]>([])
  const [diffSheetA, setDiffSheetA] = useState<string>("")
  const [diffSheetB, setDiffSheetB] = useState<string>("")
  const [diffUseHeader, setDiffUseHeader] = useState(true)

  const runExtract = async (mode: "json" | "excel") => {
    // Directory Listing (ZIP upload)
    if (toolId === "tool-0") {
      if (!dirZip) {
        setResults("ZIP 파일을 업로드해주세요.")
        return
      }
      setIsRunning(true)
      setResults(null)
      setTableJson(null)
      try {
        const form = new FormData()
        form.append("zip", dirZip)
        form.append("include_ini", String(dirIncludeIni))
        form.append("include_log", String(dirIncludeLog))
        form.append("include_txt", String(dirIncludeTxt))
        if (mode === "json") {
          const res = await fetch(`${API_BASE}/dir/zip/list`, { method: "POST", body: form })
          if (!res.ok) throw new Error("목록 조회 실패")
          const data = await res.json()
          setTableJson(data)
          setResults("목록 로드 완료")
        } else {
          const res = await fetch(`${API_BASE}/dir/zip/list/excel`, { method: "POST", body: form })
          if (!res.ok) throw new Error("엑셀 생성 실패")
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
      {
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
  }

    // Merge logs to Excel
    if (toolId === "tool-3") {
      if (!mergeFiles || mergeFiles.length === 0) {
        setResults("병합할 파일을 선택해주세요.")
        return
      }
      setIsRunning(true)
      setResults(null)
      setTableJson(null)
      try {
        const form = new FormData()
        Array.from(mergeFiles).forEach((f) => form.append("files", f))
        if (mode === "json") {
          const res = await fetch(`${API_BASE}/merge/preview`, { method: "POST", body: form })
          if (!res.ok) throw new Error("미리보기 생성 실패")
          const data = await res.json()
          setTableJson(data)
          setResults("미리보기 로드 완료")
        } else {
          form.append("output_name", mergeOutputName || "merged_logs.xlsx")
          const res = await fetch(`${API_BASE}/merge/excel`, { method: "POST", body: form })
          if (!res.ok) throw new Error("엑셀 생성 실패")
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

    // Distribute logs from Excel
    if (toolId === "tool-4") {
      if (!distExcel) {
        setResults("엑셀 파일을 업로드해주세요.")
        return
      }
      setIsRunning(true)
      setResults(null)
      setTableJson(null)
      try {
        const form = new FormData()
        form.append("excel", distExcel)
        if (mode === "json") {
          const res = await fetch(`${API_BASE}/distribute/preview`, { method: "POST", body: form })
          if (!res.ok) throw new Error("미리보기 생성 실패")
          const data = await res.json()
          setTableJson(data)
          setResults("미리보기 로드 완료")
        } else {
          form.append("format", distFormat)
          const res = await fetch(`${API_BASE}/distribute/zip`, { method: "POST", body: form })
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
      return
    }
    // LLDP (combined tabs)
    if (toolId === "tool-5") {
      {
        if (!lldpFiles || lldpFiles.length === 0) {
          setResults("LLDP 로그 파일을 선택해주세요.")
          return
        }
        setIsRunning(true)
        setResults(null)
        setTableJson(null)
        try {
          const form = new FormData()
          const lldpAll = Array.from(lldpFiles)
          const lldpLogs = lldpAll.filter((f) => /\.(log|txt)$/i.test(f.name))
          const lldpZips = lldpAll.filter((f) => /\.(zip)$/i.test(f.name))
          lldpLogs.forEach((f) => form.append("files", f))
          lldpZips.forEach((f) => form.append("zips", f))
          form.append("pattern", lldpPattern)
          form.append("include_description", String(lldpIncludeDesc))
          if (mode === "json") {
            const res = await fetch(`${API_BASE}/lldp/hostname/preview`, { method: "POST", body: form })
            if (!res.ok) throw new Error("미리보기 생성 실패")
            const data = await res.json()
            setTableJson(data)
            setResults("미리보기 로드 완료")
          } else {
            const res = await fetch(`${API_BASE}/lldp/hostname/excel`, { method: "POST", body: form })
            if (!res.ok) throw new Error("엑셀 생성 실패")
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            setResults(url)
          }
        } catch (e: any) {
          setResults(`에러: ${e.message}`)
        } finally {
          setIsRunning(false)
        }
      
        // OUI 처리 제거
      }
      return
    }

    // Excel sheet diff (client-side)
    if (toolId === "tool-6") {
      if (!diffExcel) {
        setResults("엑셀 파일을 업로드해주세요.")
        return
      }
      if (!diffSheetA || !diffSheetB) {
        setResults("비교할 시트를 선택해주세요.")
        return
      }
      setIsRunning(true)
      setResults(null)
      setTableJson(null)
      try {
        const XLSX = await import("xlsx")
        const data = await diffExcel.arrayBuffer()
        const wb = XLSX.read(data, { type: "array" })
        const wsA = wb.Sheets[diffSheetA]
        const wsB = wb.Sheets[diffSheetB]
        if (!wsA || !wsB) throw new Error("선택한 시트를 찾을 수 없습니다.")
        const aoaA: any[][] = XLSX.utils.sheet_to_json(wsA, { header: 1, blankrows: false }) as any
        const aoaB: any[][] = XLSX.utils.sheet_to_json(wsB, { header: 1, blankrows: false }) as any

        const startRow = diffUseHeader ? 1 : 0
        const headersA: string[] = diffUseHeader ? (aoaA[0] as any[] || []).map((v) => String(v ?? "")) : []
        const headersB: string[] = diffUseHeader ? (aoaB[0] as any[] || []).map((v) => String(v ?? "")) : []
        const rowMax = Math.max(aoaA.length, aoaB.length)
        const colMaxA = Math.max(0, ...aoaA.map((r) => (Array.isArray(r) ? r.length : 0)))
        const colMaxB = Math.max(0, ...aoaB.map((r) => (Array.isArray(r) ? r.length : 0)))
        const colMax = Math.max(colMaxA, colMaxB)

        const toColLetter = (n: number) => {
          let s = ""
          let num = n + 1
          while (num > 0) {
            const mod = (num - 1) % 26
            s = String.fromCharCode(65 + mod) + s
            num = Math.floor((num - 1) / 26)
          }
          return s
        }

        const diffs: any[] = []
        for (let r = startRow; r < rowMax; r++) {
          for (let c = 0; c < colMax; c++) {
            const vA = aoaA[r]?.[c]
            const vB = aoaB[r]?.[c]
            const a = vA === undefined || vA === null ? "" : String(vA)
            const b = vB === undefined || vB === null ? "" : String(vB)
            if (a === "" && b === "") continue
            if (a !== b) {
              const status = a !== "" && b !== "" ? "different" : a !== "" ? "only_in_A" : "only_in_B"
              diffs.push({
                sheetA: diffSheetA,
                sheetB: diffSheetB,
                row: r + 1,
                column: toColLetter(c),
                header: diffUseHeader ? (headersA[c] || headersB[c] || "") : "",
                valueA: a,
                valueB: b,
                status,
              })
            }
          }
        }

        if (mode === "json") {
          setTableJson(diffs)
          setResults("시트 비교 완료")
        } else {
          const headerRow = ["sheetA", "sheetB", "row", "column", "header", "valueA", "valueB", "status"]
          const aoa = [headerRow, ...diffs.map((d) => [d.sheetA, d.sheetB, d.row, d.column, d.header, d.valueA, d.valueB, d.status])]
          const outWb = XLSX.utils.book_new()
          const ws = XLSX.utils.aoa_to_sheet(aoa)
          XLSX.utils.book_append_sheet(outWb, ws, "Differences")
          const wbout = XLSX.write(outWb, { type: "array", bookType: "xlsx" })
          const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
          const url = URL.createObjectURL(blob)
          setResults(url)
        }
      } catch (e: any) {
        setResults(`오류: ${e.message}`)
      } finally {
        setIsRunning(false)
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
    // If ZIP provided (legacy) – disabled; unified handler below
    if (false) {
      try {
        const form = new FormData()
        // unified: no direct zip handling here
        form.append("include_ip", String(includeIp))
        form.append("include_model", String(includeModel))
        form.append("include_serial", String(includeSerial))
        form.append("include_hostname", String(includeHostname))
        form.append("include_image", String(includeImage))
        form.append("include_image_selected", String(includeImageSelected))
        form.append("include_image_booted", String(includeImageBooted))
        if (mode === "json") {
          const res = await fetch(`${API_BASE}/extract/zip/json`, { method: "POST", body: form })
          if (!res.ok) throw new Error("JSON 추출 실패")
          const data = await res.json()
          setTableJson(data)
          setResults("JSON 미리보기 로드 완료")
        } else {
          const res = await fetch(`${API_BASE}/extract/zip/excel`, { method: "POST", body: form })
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
      return
    }
    try {
      const form = new FormData()
      const all = Array.from(files)
      const selected = all.filter((f) => /\.(log|txt)$/i.test(f.name))
      const zips = all.filter((f) => /\.(zip)$/i.test(f.name))
      if (selected.length === 0 && zips.length === 0) {
        setResults("폴더 내 log/txt 파일이 없습니다.")
        return
      }
      selected.forEach((f) => form.append("files", f))
      zips.forEach((f) => form.append("zips", f))
      form.append("include_ip", String(includeIp))
      form.append("include_model", String(includeModel))
      form.append("include_serial", String(includeSerial))
      form.append("include_hostname", String(includeHostname))
      form.append("include_image", String(includeImage))
      form.append("include_image_selected", String(includeImageSelected))
      form.append("include_image_booted", String(includeImageBooted))

      if (mode === "json") {
        const res = await fetch(`${API_BASE}/extract/any/json`, { method: "POST", body: form })
        if (!res.ok) throw new Error("JSON 추출 실패")
        const data = await res.json()
        setTableJson(data)
        setResults("JSON 미리보기 로드 완료")
      } else {
        const res = await fetch(`${API_BASE}/extract/any/excel`, { method: "POST", body: form })
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
    if (toolId === "tool-6") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="diff-excel">엑셀 파일 업로드</Label>
            <div className="flex items-center gap-2">
              <Input
                id="diff-excel"
                type="file"
                accept=".xlsx,.xls"
                onChange={async (e) => {
                  const f = e.target.files?.[0] ?? null
                  setDiffExcel(f)
                  setDiffSheets([])
                  setDiffSheetA("")
                  setDiffSheetB("")
                  if (f) {
                    try {
                      const XLSX = await import("xlsx")
                      const data = await f.arrayBuffer()
                      const wb = XLSX.read(data, { type: "array" })
                      const names = wb.SheetNames || []
                      setDiffSheets(names)
                      setDiffSheetA(names[0] || "")
                      setDiffSheetB(names[1] || names[0] || "")
                    } catch (err) {
                      console.error(err)
                    }
                  }
                }}
              />
              <Button variant="outline" size="icon">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sheet-a">Sheet A</Label>
              <Select value={diffSheetA} onValueChange={(v) => setDiffSheetA(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="시트를 선택" />
                </SelectTrigger>
                <SelectContent>
                  {diffSheets.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sheet-b">Sheet B</Label>
              <Select value={diffSheetB} onValueChange={(v) => setDiffSheetB(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="시트를 선택" />
                </SelectTrigger>
                <SelectContent>
                  {diffSheets.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="use-header" checked={diffUseHeader} onCheckedChange={(v) => setDiffUseHeader(!!v)} />
            <Label htmlFor="use-header">첫 행을 헤더로 사용</Label>
          </div>
        </div>
      )
    }
    switch (toolId) {
      case "tool-0":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="dir-zip">디렉토리 ZIP 업로드</Label>
              <div className="flex items-center gap-2">
                <Input id="dir-zip" type="file" accept=".zip" onChange={(e) => setDirZip(e.target.files?.[0] ?? null)} />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">디렉토리를 ZIP으로 압축하여 업로드하면 내부의 .ini/.log/.txt 파일 목록을 생성합니다.</p>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      INI 파일 기본 위치: <code>C:/Users/사용자/AppData/Roaming/VanDyke/Config/Sessions</code>
                    </p>
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
                    <Label htmlFor="hostname-template">템플릿 INI</Label>
                    <div className="flex items-center gap-2">
                      <Input id="hostname-template" type="file" accept=".ini" onChange={(e) => setCrtTemplate(e.target.files?.[0] ?? null)} />
                      <Button variant="outline" size="icon">
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      템플릿 INI 기본 위치: <code>C:/Users/사용자/AppData/Roaming/VanDyke/Config/Sessions</code>
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="hostname-list">Hostname 목록 TXT</Label>
                    <div className="flex items-center gap-2">
                      <Input id="hostname-list" type="file" accept=".txt" onChange={(e) => setCrtHostList(e.target.files?.[0] ?? null)} />
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
              <Label htmlFor="log-folder">로그/ZIP 파일 업로드</Label>
              <div className="flex items-center gap-2">
                {/* Unified upload: .log/.txt/.zip */}
                <Input
                  id="log-folder"
                  type="file"
                  multiple
                  accept=".log,.txt,.zip"
                  onChange={(e) => setFiles(e.target.files)}
                />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">업로드한 항목에서 .log/.txt만 자동 추출합니다. ZIP 내부는 하위 디렉토리까지 모두 탐색합니다.</p>
            </div>
          </div>
        )
      case "tool-3":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="merge-files">병합할 파일 선택</Label>
              <div className="flex items-center gap-2">
                <Input id="merge-files" type="file" multiple accept=".log,.txt" onChange={(e) => setMergeFiles(e.target.files)} />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="output-name">출력 파일명</Label>
              <Input id="output-name" placeholder="merged_logs.xlsx" value={mergeOutputName} onChange={(e) => setMergeOutputName(e.target.value)} />
            </div>
          </div>
        )
      case "tool-4":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="excel-file">엑셀 파일 업로드</Label>
              <div className="flex items-center gap-2">
                <Input id="excel-file" type="file" accept=".xlsx,.xls" onChange={(e) => setDistExcel(e.target.files?.[0] ?? null)} />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="output-format">출력 형식</Label>
              <Select value={distFormat} onValueChange={(v) => setDistFormat((v as any) === "log" ? "log" : "txt") }>
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
                <Input id="lldp-files" type="file" multiple accept=".log,.txt,.zip" onChange={(e) => setLldpFiles(e.target.files)} />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="hostname-pattern">호스트네임 패턴</Label>
              <Input id="hostname-pattern" placeholder="SW-*" value={lldpPattern} onChange={(e) => setLldpPattern(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="include-description" checked={lldpIncludeDesc} onCheckedChange={(v) => setLldpIncludeDesc(!!v)} />
              <Label htmlFor="include-description">정확히 일치만</Label>
            </div>
          </div>
        )
      default:
        return <div>도구를 선택해주세요.</div>
    }
  }

  const getToolTitle = () => {
    if (toolId === "tool-6") return "Excel 시트 비교"
    const titles = [
      "디렉토리 Listing",
      "SecureCRT 세션 생성",
      "모델/시리얼/호스트네임 추출",
      "로그 파일 병합",
      "로그 파일 분산",
      "LLDP 포트 추출",
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

      <div className="grid grid-cols-1 gap-6">
        <div>
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
                  {toolId === "tool-1" || toolId === "tool-4" ? "ZIP 다운로드" : "엑셀 다운로드"}
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
                    download={toolId === "tool-1" ? "securecrt-sessions.zip" : toolId === "tool-0" ? "directory-listing.xlsx" : toolId === "tool-3" ? (mergeOutputName || "merged_logs.xlsx") : toolId === "tool-4" ? "distributed-logs.zip" : toolId === "tool-5" ? "lldp.xlsx" : toolId === "tool-6" ? "excel-diff.xlsx" : "hostname-serial.xlsx"}
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




