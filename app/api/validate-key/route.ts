import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "Invalid API key format. OpenAI keys should start with 'sk-'" },
        { status: 400 },
      )
    }

    // First check if the API key is valid by fetching models
    const modelsResponse = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!modelsResponse.ok) {
      const error = await modelsResponse.json()
      return NextResponse.json(
        {
          valid: false,
          keyValidationMessage: error.error?.message || "Invalid API key or API request failed",
          hasCredits: false,
          creditCheckPerformed: false,
        },
        { status: 401 },
      )
    }

    // Key is valid, now make a small test request to check for credits
    const testCompletionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5, // Minimal tokens to check credit status
      }),
    })

    if (testCompletionResponse.ok) {
      return NextResponse.json({
        valid: true,
        keyValidationMessage: "API key is valid.",
        hasCredits: true,
        creditCheckPerformed: true,
        creditCheckMessage: "Account has available credits to start conversations.",
      })
    } else {
      const error = await testCompletionResponse.json()

      // Check if the error is related to insufficient credits
      if (
        error.error?.type === "insufficient_quota" ||
        (error.error?.message && error.error.message.includes("quota"))
      ) {
        return NextResponse.json({
          valid: true,
          keyValidationMessage: "API key is valid.",
          hasCredits: false,
          creditCheckPerformed: true,
          creditCheckMessage: "Insufficient credits to start conversations.",
          creditErrorDetails: error.error?.message,
        })
      }

      return NextResponse.json({
        valid: true,
        keyValidationMessage: "API key is valid.",
        hasCredits: false,
        creditCheckPerformed: true,
        creditCheckMessage: "Error when testing credits.",
        creditErrorDetails: error.error?.message || "Unknown error when testing API credits",
      })
    }
  } catch (error) {
    console.error("Error validating API key:", error)
    return NextResponse.json({ error: "An error occurred during validation" }, { status: 500 })
  }
}

