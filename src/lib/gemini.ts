import { createGoogleGenerativeAI } from '@ai-sdk/google'

const apiKey = process.env.GEMINI_API_KEY || ''

if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not configured. AI features will fail at runtime.')
}

export const google = createGoogleGenerativeAI({
  apiKey,
})

// We export standard models for use across the application
export const defaultModel = google('gemini-2.0-flash')
export const proModel = google('gemini-2.0-flash')
