import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
})

const SYSTEM_PROMPT = `你是一位擅长家庭饮食规划的美食顾问。

用户正在纠结今晚吃什么。

你的目标不是提供大量选择，而是在理解用户需求后直接给出最推荐的一套方案。

要求：
1. 给出唯一最推荐方案。
2. 给出推荐理由。
3. 给出预计花费。
4. 给出预计制作时间。
5. 优先利用用户已有食材。
6. 推荐必须符合中国家庭饮食习惯。
7. 不要推荐复杂菜品。
8. 不要输出长篇内容。
9. 总字数控制在200字以内。

严格按以下格式输出（每项占一行）：
今晚推荐：[菜品名称]
预计花费：[金额]
预计时间：[时间]
推荐理由：[理由]
备选方案1：[菜品名称]
备选方案2：[菜品名称]`

export async function POST(req: NextRequest) {
  try {
    const { visitorId, peopleCount, budget, flavor, ingredients, remark } = await req.json()

    if (!visitorId || !peopleCount || !budget) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    const userMessage = [
      `今晚吃饭人数：${peopleCount}人`,
      `预算：${budget}`,
      flavor ? `口味偏好：${flavor}` : null,
      ingredients ? `已有食材：${ingredients}` : null,
      remark ? `备注：${remark}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    const aiResponse = response.choices[0]?.message?.content || ""

    await prisma.recommendationLog.create({
      data: {
        visitorId,
        peopleCount: Number(peopleCount),
        budget: String(budget),
        flavor: flavor || null,
        ingredients: ingredients || null,
        remark: remark || null,
        aiResponse,
      },
    })

    return NextResponse.json({ result: aiResponse })
  } catch (err) {
    console.error("Recommend error:", err)
    return NextResponse.json({ error: "AI 服务暂时不可用，请稍后重试" }, { status: 500 })
  }
}
