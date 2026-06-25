import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"

const SYSTEM_PROMPT = `你是一位中国家庭饮食规划顾问。

请根据用户提供的信息规划未来7天晚餐菜单。

要求：
1. 不要连续两天重复主菜。
2. 荤素搭配。
3. 优先使用常见食材。
4. 基于用户给的预算出菜单。
5. 菜单的价位应该符合预算。
6. 工作日晚餐优先简单快手菜。
7. 周末允许稍微丰富。
8. 输出采购清单。
9. 输出预计总花费，预计总花费是日均预算乘以7天的估算，预算上下浮动会有影响，但尽量靠近预算，预计总花费应根据菜品的市场价格进行合理估算。
10. 输出总字数控制在500字以内。

严格按以下格式输出：
周一：
菜品：[菜品]

周二：
菜品：[菜品]

周三：
菜品：[菜品]

周四：
菜品：[菜品]

周五：
菜品：[菜品]

周六：
菜品：[菜品]

周日：
菜品：[菜品]

本周采购清单：[清单内容]

预计总花费：[金额]`

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
      `家庭人数：${peopleCount}人`,
      `每日晚餐预算：${budget}`,
      flavor ? `口味偏好：${flavor}` : null,
      ingredients ? `已有食材：${ingredients}` : null,
      remark ? `特殊备注：${remark}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_tokens: 800,
      temperature: 1.2,
    })

    const weeklyPlanResponse = response.choices[0]?.message?.content || ""

    await prisma.weeklyPlanLog.create({
      data: {
        visitorId,
        peopleCount: Number(peopleCount),
        budget: String(budget),
        flavor: flavor || null,
        ingredients: ingredients || null,
        remark: remark || null,
        weeklyPlanResponse,
      },
    })

    return NextResponse.json({ result: weeklyPlanResponse })
  } catch (err) {
    console.error("Weekly plan error:", err)
    return NextResponse.json({ error: "AI 服务暂时不可用，请稍后重试" }, { status: 500 })
  }
}
