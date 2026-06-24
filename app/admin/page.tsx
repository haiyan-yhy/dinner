"use client"

import { useState } from "react"

type Keyword = { word: string; count: number }

type Stats = {
  totalVisitors: number
  totalRecommendations: number
  totalWeeklyPlans: number
  returningVisitors: number
  avgDurationSeconds: number
  keywords: Keyword[]
  recentInputs: Array<{
    id: number
    createdAt: string
    peopleCount: number
    budget: string
    flavor: string | null
    ingredients: string | null
    remark: string | null
  }>
  recentOutputs: Array<{ id: number; createdAt: string; aiResponse: string }>
  recentWeeklyPlans: Array<{ id: number; createdAt: string; weeklyPlanResponse: string }>
}

type DataTab = "inputs" | "outputs" | "weekly"

export default function AdminPage() {
  const [secret, setSecret] = useState("")
  const [authed, setAuthed] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [dataTab, setDataTab] = useState<DataTab>("inputs")

  const fetchStats = async (s: string) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/stats?secret=${encodeURIComponent(s)}`)
      if (res.status === 401) { setError("密码错误"); setLoading(false); return }
      const data = await res.json()
      setStats(data)
      setAuthed(true)
    } catch {
      setError("加载失败")
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = (type: string) =>
    window.open(`/api/admin/export?secret=${encodeURIComponent(secret)}&type=${type}`)

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-xs space-y-4">
          <h1 className="text-xl font-bold text-gray-800 text-center">管理后台</h1>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="请输入访问密码"
            onKeyDown={(e) => e.key === "Enter" && fetchStats(secret)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            onClick={() => fetchStats(secret)}
            disabled={loading}
            className="w-full bg-orange-500 text-white rounded-xl py-3 font-medium"
          >
            {loading ? "验证中..." : "进入"}
          </button>
        </div>
      </main>
    )
  }

  if (!stats) return null

  const avgMin = Math.floor(stats.avgDurationSeconds / 60)
  const avgSec = Math.floor(stats.avgDurationSeconds % 60)
  const maxKeywordCount = stats.keywords[0]?.count || 1

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">管理后台</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-gray-400 text-xs mb-1">总访问人数</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalVisitors}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-gray-400 text-xs mb-1">总推荐次数</p>
          <p className="text-2xl font-bold text-orange-500">{stats.totalRecommendations}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-gray-400 text-xs mb-1">周菜单生成次数</p>
          <p className="text-2xl font-bold text-orange-500">{stats.totalWeeklyPlans}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-gray-400 text-xs mb-1">回访用户</p>
          <p className="text-2xl font-bold text-gray-800">{stats.returningVisitors}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 col-span-2">
          <p className="text-gray-400 text-xs mb-1">平均停留时长</p>
          <p className="text-2xl font-bold text-gray-800">
            {avgMin > 0 ? `${avgMin}分${avgSec}秒` : `${avgSec}秒`}
          </p>
        </div>
      </div>

      {/* Keyword Analysis */}
      {stats.keywords.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <p className="text-gray-600 text-sm font-medium mb-3">高频关键词（口味 + 备注）</p>
          <div className="space-y-2">
            {stats.keywords.map(({ word, count }) => (
              <div key={word} className="flex items-center gap-3">
                <span className="text-gray-700 text-sm w-20 flex-shrink-0">{word}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-orange-400 h-2 rounded-full"
                    style={{ width: `${(count / maxKeywordCount) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-xs w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <p className="text-gray-600 text-sm font-medium mb-3">导出数据</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "visit_logs.csv", type: "visits" },
            { label: "recommendation_logs.csv", type: "recommendations" },
            { label: "weekly_plan_logs.csv", type: "weekly" },
            { label: "page_duration_logs.csv", type: "durations" },
          ].map(({ label, type }) => (
            <button
              key={type}
              onClick={() => exportCSV(type)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["inputs", "outputs", "weekly"] as DataTab[]).map((tab) => {
            const labels = { inputs: "用户输入", outputs: "今晚推荐", weekly: "周菜单" }
            return (
              <button
                key={tab}
                onClick={() => setDataTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  dataTab === tab ? "text-orange-600 border-b-2 border-orange-500" : "text-gray-400"
                }`}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>

        <div className="p-4 max-h-96 overflow-y-auto space-y-3">
          {dataTab === "inputs" &&
            stats.recentInputs.map((r) => (
              <div key={r.id} className="text-xs border border-gray-100 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>#{r.id}</span>
                  <span>{new Date(r.createdAt).toLocaleString("zh-CN")}</span>
                </div>
                <p className="text-gray-700">
                  {r.peopleCount}人 · {r.budget}
                  {r.flavor && ` · ${r.flavor}`}
                  {r.ingredients && ` · 有：${r.ingredients}`}
                  {r.remark && ` · ${r.remark}`}
                </p>
              </div>
            ))}

          {dataTab === "outputs" &&
            stats.recentOutputs.map((r) => (
              <div key={r.id} className="text-xs border border-gray-100 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>#{r.id}</span>
                  <span>{new Date(r.createdAt).toLocaleString("zh-CN")}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{r.aiResponse}</p>
              </div>
            ))}

          {dataTab === "weekly" &&
            stats.recentWeeklyPlans.map((r) => (
              <div key={r.id} className="text-xs border border-gray-100 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>#{r.id}</span>
                  <span>{new Date(r.createdAt).toLocaleString("zh-CN")}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{r.weeklyPlanResponse}</p>
              </div>
            ))}

          {((dataTab === "inputs" && stats.recentInputs.length === 0) ||
            (dataTab === "outputs" && stats.recentOutputs.length === 0) ||
            (dataTab === "weekly" && stats.recentWeeklyPlans.length === 0)) && (
            <p className="text-gray-400 text-xs text-center py-4">暂无数据</p>
          )}
        </div>
      </div>
    </main>
  )
}
