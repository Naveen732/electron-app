import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai'

export class LlmRepository {
  constructor() {
    this.llm = null
  }

  wasmPath = window.paths.getWasmUrl()

  async load(modelPath) {
    if (this.llm) return

    const start = performance.now()

    const genai = await FilesetResolver.forGenAiTasks(this.wasmPath)

    this.llm = await LlmInference.createFromOptions(genai, {
      baseOptions: { modelAssetPath: modelPath, delegate: 'gpu' },
      maxTokens: 4096
    })

    const end = performance.now()

    const loadTime = (end - start).toFixed(2)

    return { loadTime }
  }

  async generate(prompt) {
    if (!this.llm) {
      throw new Error('Model not loaded')
    }

    const start = performance.now()

    const response = await this.llm.generateResponse(prompt)

    const end = performance.now()

    const inferenceTime = (end - start).toFixed(2)

    return {
      response,
      inferenceTime
    }
  }

  async dispose() {
  if (!this.llm) return

    await this.llm.close()   
    this.llm = null
  }
}
