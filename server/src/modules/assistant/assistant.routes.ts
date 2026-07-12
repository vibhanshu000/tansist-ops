import { Router } from "express";
import { z } from "zod";
import { ok, wrap } from "../../lib/http.js";
import { AppError } from "../../middleware/errorHandler.js";
import { TOOL_DEFINITIONS, executeTool, type ToolContext } from "./assistant.tools.js";

export const assistantRouter = Router();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_TOOL_ROUNDS = 6;

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .min(1)
    .max(40),
});

function systemPrompt(ctx: ToolContext): string {
  return [
    "You are TransitOps Copilot, an assistant embedded in a fleet operations platform.",
    "You help manage vehicles, drivers, trips, maintenance, fuel and compliance.",
    "You can read the live database and perform actions ONLY through the provided tools — never invent data.",
    `The signed-in user is ${ctx.userName} with role ${ctx.role}.`,
    "Role-based access: only a Fleet Manager can create, update, delete or change the status of vehicles, or open/close maintenance. If a tool returns a permission error, explain it plainly and do not retry.",
    "Managing a vehicle's status controls its dispatch availability: Available = dispatchable, InShop = in maintenance (hidden from dispatch), OnTrip = on a trip, Retired = removed from service.",
    "Before deleting a vehicle, make sure the user has clearly confirmed the specific vehicle; if it is ambiguous, ask first.",
    "When you use a tool, base your answer strictly on the returned data. Keep replies concise and use compact markdown tables or short bullet lists for multiple records. Format currency in Indian Rupees (₹).",
    "If the user asks for something outside fleet operations, politely steer back.",
  ].join(" ");
}

interface GroqMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
}

async function callGroq(messages: GroqMessage[]) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new AppError("GROQ_API_KEY is not configured on the server.", 500);
  const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AppError(`Groq API error (${res.status}): ${text.slice(0, 300)}`, 502);
  }
  return res.json();
}

// POST /assistant/chat  { messages: [{role, content}] }
assistantRouter.post(
  "/chat",
  wrap(async (req, res) => {
    const { messages } = chatSchema.parse(req.body);
    const ctx: ToolContext = {
      role: req.user!.role,
      userName: req.user!.name,
    };

    const convo: GroqMessage[] = [
      { role: "system", content: systemPrompt(ctx) },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const actions: { tool: string; args: unknown; result: unknown }[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const data = await callGroq(convo);
      const choice = data.choices?.[0];
      const msg = choice?.message;
      if (!msg) throw new AppError("Empty response from the model.", 502);

      const toolCalls = msg.tool_calls ?? [];
      if (toolCalls.length === 0) {
        return ok(res, { reply: msg.content ?? "", actions });
      }

      // Record the assistant's tool-call turn, then execute each call.
      convo.push({ role: "assistant", content: msg.content ?? null, tool_calls: toolCalls });

      for (const call of toolCalls) {
        const toolName = call.function?.name as string;
        let parsedArgs: any = {};
        try {
          parsedArgs = call.function?.arguments ? JSON.parse(call.function.arguments) : {};
        } catch {
          parsedArgs = {};
        }
        const result = await executeTool(toolName, parsedArgs, ctx);
        actions.push({ tool: toolName, args: parsedArgs, result });
        convo.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Safety valve: too many tool rounds. Ask the model for a final summary with no tools.
    const finalData = await callGroq([
      ...convo,
      {
        role: "user",
        content:
          "Please give me your best final answer now based on the information gathered, without calling any more tools.",
      },
    ]);
    const finalMsg = finalData.choices?.[0]?.message?.content ?? "I wasn't able to complete that request.";
    return ok(res, { reply: finalMsg, actions });
  })
);
