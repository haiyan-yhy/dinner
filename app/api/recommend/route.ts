import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"

const SYSTEM_PROMPT = `你是一位擅长家庭饮食规划的美食顾问。

用户正在纠结今晚吃什么。

你的目标是根据用户需求，直接给出最适合今晚的一套菜肴方案。

要求：
1. 推荐以炒菜、炖菜、蒸菜、凉拌等家常菜肴为主，不要推荐面条、米饭、粥、饺子等主食类。
2. 菜品的价位和用户的预算要合理匹配。
3. 推荐方案要多样，每次都给出不同的菜品组合，避免重复。
4. 给出推荐理由。
5. 给出预计花费，预计花费应根据菜品的市场价格进行合理估算。
6. 给出预计制作时间。
7. 优先利用用户已有食材。
8. 推荐必须符合中国家庭饮食习惯。
9. 菜品不要太复杂，适合家庭日常烹饪。
10. 不要输出长篇内容，总字数控制在200字以内。

严格按以下格式输出（每项占一行）：
今晚推荐：[菜品名称，可以是2-3道菜的组合]
预计花费：[金额]
预计时间：[时间]
推荐理由：[理由]
备选方案1：[2-3道菜的组合]
备选方案2：[2-3道菜的组合]`

export async function POST(req: NextRequest) {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  })

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
      max_tokens: 400,
      temperature: 1.2,
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
