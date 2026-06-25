"use client"

import { useState } from "react"
import { useTracker } from "@/lib/tracker"

type Recommendation = {
  recommendation: string
  cost: string
  time: string
  reason: string
  alt1: string
  alt2: string
  raw: string
}

type FormData = {
  peopleCount: string
  budget: string
  flavor: string
  ingredients: string
  remark: string
}

function parseRecommendation(text: string): Recommendation {
  const extract = (key: string) => {
    const match = text.match(new RegExp(`${key}[：:]\\s*(.+)`))
    return match ? match[1].trim() : ""
  }
  return {
    recommendation: extract("今晚推荐"),
    cost: extract("预计花费"),
    time: extract("预计时间"),
    reason: extract("推荐理由"),
    alt1: extract("备选方案1"),
    alt2: extract("备选方案2"),
    raw: text,
  }
}

function parseWeeklyPlan(text: string) {
  const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
  const result: { day: string; dish: string }[] = []

  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    const nextDay = days[i + 1]
    const pattern = nextDay
      ? new RegExp(`${day}[：:]\\s*\\n菜品[：:]\\s*(.+?)(?=\\n${nextDay}|$)`, "s")
      : new RegExp(`${day}[：:]\\s*\\n菜品[：:]\\s*(.+?)(?=\\n本周采购|$)`, "s")
    const match = text.match(pattern)
    result.push({ day, dish: match ? match[1].trim() : "" })
  }

  const shoppingMatch = text.match(/本周采购清单[：:]\s*([\s\S]+?)(?=\n预计总花费|$)/)
  const costMatch = text.match(/预计总花费[：:]\s*(.+)/)

  return {
    days: result,
    shopping: shoppingMatch ? shoppingMatch[1].trim() : "",
    totalCost: costMatch ? costMatch[1].trim() : "",
    raw: text,
  }
}

export default function HomePage() {
  const { getVisitorId } = useTracker("home")

  const [form, setForm] = useState<FormData>({
    peopleCount: "",
    budget: "",
    flavor: "",
    ingredients: "",
    remark: "",
  })

  const [activeTab, setActiveTab] = useState<"today" | "weekly">("today")
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [weeklyPlan, setWeeklyPlan] = useState<ReturnType<typeof parseWeeklyPlan> | null>(null)
  const [loadingRecommend, setLoadingRecommend] = useState(false)
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const [error, setError] = useState("")
  const [weeklyError, setWeeklyError] = useState("")
  const [showResult, setShowResult] = useState(false)

  const updateForm = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingRecommend(true)
    setError("")

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: getVisitorId(), ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "请求失败")
      setRecommendation(parseRecommendation(data.result))
      setShowResult(true)
      setActiveTab("today")
    } catch (err) {
      setError(err instanceof Error ? err.message : "出错了，请重试")
    } finally {
      setLoadingRecommend(false)
    }
  }

  const handleWeeklyPlan = async () => {
    setLoadingWeekly(true)
    setWeeklyError("")

    try {
      const res = await fetch("/api/weekly-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: getVisitorId(), ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "请求失败")
      setWeeklyPlan(parseWeeklyPlan(data.result))
    } catch (err) {
      setWeeklyError(err instanceof Error ? err.message : "出错了，请重试")
    } finally {
      setLoadingWeekly(false)
    }
  }

  const handleReset = () => {
    setShowResult(false)
    setRecommendation(null)
    setWeeklyPlan(null)
    setError("")
    setWeeklyError("")
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-600">今晚 / 本周吃什么？</h1>
        </div>

        {!showResult ? (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用餐人数 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.peopleCount}
                onChange={updateForm("peopleCount")}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none"
              >
                <option value="">请选择</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n} 人</option>
                ))}
                <option value="6+">6 人以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                预算 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.budget}
                onChange={updateForm("budget")}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none"
              >
                <option value="">请选择</option>
                <option value="20元以内">20 元以内</option>
                <option value="20-50元">20 - 50 元</option>
                <option value="50-100元">50 - 100 元</option>
                <option value="100-200元">100 - 200 元</option>
                <option value="200元以上">200 元以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                口味偏好 <span className="text-gray-400 text-xs">可选</span>
              </label>
              <input
                type="text"
                value={form.flavor}
                onChange={updateForm("flavor")}
                placeholder="不吃辣、清淡、减脂…"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                已有食材 <span className="text-gray-400 text-xs">可选</span>
              </label>
              <input
                type="text"
                value={form.ingredients}
                onChange={updateForm("ingredients")}
                placeholder="鸡蛋、西红柿、豆腐…"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注 <span className="text-gray-400 text-xs">可选</span>
              </label>
              <textarea
                value={form.remark}
                onChange={updateForm("remark")}
                placeholder="想吃肉、孩子吃、20分钟内搞定…"
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingRecommend || !form.peopleCount || !form.budget}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold text-lg rounded-xl py-4 transition-colors duration-200"
            >
              {loadingRecommend ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  正在为你推荐...
                </span>
              ) : (
                "帮我决定"
              )}
            </button>
          </form>
        ) : (
          /* ── Result Tabs ── */
          <div>
            {/* Tab headers */}
            <div className="flex border-b border-gray-200 mb-5">
              <button
                onClick={() => setActiveTab("today")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "today"
                    ? "text-orange-600 border-b-2 border-orange-500"
                    : "text-gray-400"
                }`}
              >
                今晚推荐
              </button>
              <button
                onClick={() => setActiveTab("weekly")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "weekly"
                    ? "text-orange-600 border-b-2 border-orange-500"
                    : "text-gray-400"
                }`}
              >
                本周菜单
              </button>
            </div>

            {/* Tab1: Today */}
            {activeTab === "today" && recommendation && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
                  <div className="bg-orange-500 px-5 py-4">
                    <p className="text-orange-100 text-xs mb-1">今晚推荐</p>
                    <h2 className="text-white text-2xl font-bold">
                      {recommendation.recommendation || "见下方详情"}
                    </h2>
                  </div>
                  <div className="px-5 py-4 grid grid-cols-2 gap-3">
                    <div className="bg-orange-50 rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-1">预计花费</p>
                      <p className="text-orange-600 font-semibold">{recommendation.cost || "-"}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-1">预计时间</p>
                      <p className="text-orange-600 font-semibold">{recommendation.time || "-"}</p>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <p className="text-gray-400 text-xs mb-1">推荐理由</p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {recommendation.reason || recommendation.raw}
                    </p>
                  </div>
                </div>

                {(recommendation.alt1 || recommendation.alt2) && (
                  <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                    <p className="text-gray-400 text-xs mb-3">不满意？还有备选</p>
                    <div className="space-y-2">
                      {recommendation.alt1 && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center flex-shrink-0">1</span>
                          <span className="text-sm">{recommendation.alt1}</span>
                        </div>
                      )}
                      {recommendation.alt2 && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center flex-shrink-0">2</span>
                          <span className="text-sm">{recommendation.alt2}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab2: Weekly */}
            {activeTab === "weekly" && (
              <div className="space-y-3">
                {!weeklyPlan ? (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm mb-5">
                      基于你的偏好，生成本周7天晚餐菜单 + 采购清单
                    </p>
                    {weeklyError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">
                        {weeklyError}
                      </div>
                    )}
                    <button
                      onClick={handleWeeklyPlan}
                      disabled={loadingWeekly}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl py-4 transition-colors"
                    >
                      {loadingWeekly ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                          AI 正在规划菜单...
                        </span>
                      ) : (
                        "生成本周菜单"
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="bg-orange-500 px-5 py-3">
                        <p className="text-white font-medium text-sm">本周菜单</p>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {weeklyPlan.days.map(({ day, dish }) => (
                          <div key={day} className="flex items-start gap-3 px-5 py-3">
                            <span className="text-orange-500 font-medium text-sm w-8 flex-shrink-0">{day}</span>
                            <span className="text-gray-700 text-sm leading-relaxed">{dish || "-"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {weeklyPlan.shopping && (
                      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                        <p className="text-gray-400 text-xs mb-2">本周采购清单</p>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {weeklyPlan.shopping}
                        </p>
                      </div>
                    )}

                    {weeklyPlan.totalCost && (
                      <div className="bg-orange-50 rounded-2xl px-5 py-3 flex justify-between items-center">
                        <span className="text-gray-500 text-sm">预计总花费</span>
                        <span className="text-orange-600 font-semibold">{weeklyPlan.totalCost}</span>
                      </div>
                    )}

                    <button
                      onClick={handleWeeklyPlan}
                      disabled={loadingWeekly}
                      className="w-full border border-orange-300 text-orange-500 hover:bg-orange-50 text-sm rounded-xl py-3 transition-colors"
                    >
                      {loadingWeekly ? "重新生成中..." : "重新生成"}
                    </button>
                  </>
                )}
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full mt-4 border border-gray-200 text-gray-400 hover:bg-gray-50 text-sm rounded-xl py-3 transition-colors"
            >
              重新填写
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
