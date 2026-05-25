import httpStatus from "http-status";
import { GoogleGenAI } from "@google/genai";
import { User } from "../models/user.model.js";

const DEFAULT_MODEL = "gemini-1.5-flash"; // ✅ faster & stable

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ✅ Retry wrapper (handles 503)
const callAIWithRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (
        error?.status === 503 ||
        error?.message?.includes("UNAVAILABLE")
      ) {
        console.log(`Retry ${i + 1}...`);
        await sleep(1000 * (i + 1)); // small delay
      } else {
        throw error;
      }
    }
  }
  throw new Error("AI service unavailable after retries");
};

function getTokenFromReq(req) {
  const header = req.headers.authorization || "";

  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  return req.query.token || req.body?.token;
}

export const chatWithAi = async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(httpStatus.SERVICE_UNAVAILABLE).json({
      message: "Missing GEMINI_API_KEY in environment.",
    });
  }

  const token = getTokenFromReq(req);

  if (!token) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      message: "Missing token.",
    });
  }

  const { message, history } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Missing message.",
    });
  }

  try {
    // ✅ Run DB + AI prep in parallel mindset
    const user = await User.findOne({ token }).lean(); // faster

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Invalid token.",
      });
    }

    // ✅ Build lightweight prompt (less tokens = faster)
    let conversation = "";

    if (Array.isArray(history)) {
      conversation = history
        .slice(-6) // reduce size → faster response
        .map((h) =>
          h?.role === "user"
            ? `U:${h.text}`
            : h?.role === "model"
            ? `A:${h.text}`
            : ""
        )
        .join("\n");
    }

    const prompt = `You are LiveLink AI for ${user.username}.
Reply short.

${conversation}
U:${message}`;

    // ✅ Initialize AI
    const ai = new GoogleGenAI({ apiKey });

    // ✅ Add timeout (VERY IMPORTANT)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 sec max

    const response = await callAIWithRetry(() =>
      ai.models.generateContent({
        model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
        contents: prompt,
        signal: controller.signal,
      })
    );

    clearTimeout(timeout);

    const reply = response?.text || "No response";

    return res.status(httpStatus.OK).json({ reply });

  } catch (e) {
    console.error("AI ERROR:", e);

    return res.status(httpStatus.OK).json({
      reply: "⚠️ AI is busy, try again.",
    });
  }
};