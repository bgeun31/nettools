"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ToolsGrid } from "@/components/tools-grid"
import { ToolInterface } from "@/components/tool-interface"
import { LoginForm } from "@/components/login-form"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebaseClient"

export default function NetToolsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeMenu, setActiveMenu] = useState("dashboard")
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user)
    })
    return () => unsub()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    setActiveMenu("dashboard")
    setSelectedTool(null)
  }

  const handleMenuSelect = (menuId: string) => {
    setActiveMenu(menuId)
    if (menuId === "dashboard") {
      setSelectedTool(null)
    } else if (menuId !== "settings") {
      setSelectedTool(menuId)
    }
  }

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId)
    setActiveMenu(toolId)
  }

  const handleBackToDashboard = () => {
    setActiveMenu("dashboard")
    setSelectedTool(null)
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeMenu={activeMenu} onMenuSelect={handleMenuSelect} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeMenu === "dashboard" ? (
              <>
                <div className="flex items-center justify-start">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">NetTools Dashboard</h1>
                    <p className="text-muted-foreground mt-1">네트워크 관리 도구 모음</p>
                  </div>
                </div>
                <ToolsGrid onToolSelect={handleToolSelect} />
              </>
            ) : activeMenu === "settings" ? (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-foreground">설정</h1>
                <div className="bg-card p-6 rounded-lg border">
                  <p className="text-muted-foreground">설정 페이지는 추후 구현 예정입니다.</p>
                </div>
              </div>
            ) : (
              <ToolInterface toolId={activeMenu} onBack={handleBackToDashboard} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
