import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function listModels() {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.error('No API key found in .env')
    return
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    console.log('--- AVAILABLE MODELS ---')
    if (data.models) {
      data.models.forEach((m: any) => {
        console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`)
      })
    } else {
      console.log(JSON.stringify(data, null, 2))
    }
  } catch (err) {
    console.error('Error fetching models:', err)
  }
}

listModels()
