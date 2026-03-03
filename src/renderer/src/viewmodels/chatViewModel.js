import { ref, watch } from 'vue'
import { LlmRepository } from '../repositories/llmRepository'

export function useChatViewModel() {
  const repository = new LlmRepository()

  const models = ref([
    { name: 'Gemma-3n-E2B', file: 'gemma-3n-E2B-it-int4-Web.litertlm' },
    { name: 'Gemma-3n-E4B', file: 'gemma-3n-E4B-it-int4-Web.litertlm' },
    { name: 'TranslateGemma-4B', file: 'translategemma-4b-it-int8-web.task' }
  ])

  const selectedModel = ref(models.value[0])

  const isModelLoaded = ref(false)
  const isLoadingModel = ref(false)
  const loadedModelName = ref(null)

  const modelLoadProgress = ref(0)
  const modelLoadTimeMs = ref(null)

  const isWarmingUp = ref(false)
  const warmupTimeMs = ref(null)
  const isRecording = ref(false)
  let mediaRecorder = null
  let audioChunks = []
  let mediaStream = null

  watch(selectedModel, () => {
    isModelLoaded.value = loadedModelName.value === selectedModel.value.name
    modelLoadTimeMs.value = null
    warmupTimeMs.value = null
  })

  function simulateProgress() {
    modelLoadProgress.value = 0
    return setInterval(() => {
      if (modelLoadProgress.value < 90) modelLoadProgress.value += 5
    }, 200)
  }

  async function loadModel() {
    if (isLoadingModel.value) return
    if (loadedModelName.value === selectedModel.value.name) return

    isLoadingModel.value = true
    isModelLoaded.value = false

    const timer = simulateProgress()
    const start = performance.now()

    try {
      await repository.dispose?.()

      const modelPath = window.paths.getModelUrl(selectedModel.value.file)
      await repository.load(modelPath)

      modelLoadTimeMs.value = Math.round(performance.now() - start)
      modelLoadProgress.value = 100

      loadedModelName.value = selectedModel.value.name

      await warmupModel()

      isModelLoaded.value = true
    } catch (err) {
      console.error('Model load failed:', err)
      loadedModelName.value = null
    } finally {
      clearInterval(timer)
      setTimeout(() => (modelLoadProgress.value = 0), 800)
      isLoadingModel.value = false
    }
  }

  async function warmupModel() {
    isWarmingUp.value = true
    const start = performance.now()

    await repository.generate('Say OK')

    warmupTimeMs.value = Math.round(performance.now() - start)
    isWarmingUp.value = false
  }

  const defaultPrompts = [
    {
      label: 'Translate to Tamil',
      template: `You are a professional translator.

Task: Translate the given text to Tamil.

Rules:
- Output ONLY the translated Tamil text
- Do NOT explain
- Do NOT add extra text

Text:
`
    },
    {
      label: 'Translate to Hindi',
      template: `You are a professional translator.

Task: Translate the given text to Hindi.

Rules:
- Output ONLY the translated Hindi text
- Do NOT explain
- Do NOT add extra text

Text:
`
    },
    {
      label: 'Yoda Style',
      template: `Rewrite the following sentence in Yoda’s speaking style.

Rules:
- Keep the same meaning
- Output ONLY the rewritten sentence
- No explanation

Sentence:
`
    },
    {
      label: 'Caesar Style',
      template: `Rewrite the following sentence in the speaking style of Caesar from Planet of the Apes.

Rules:
- Keep meaning
- Output only the rewritten text
- No explanation

Sentence:
`
    }
  ]

  const prompts = ref(JSON.parse(localStorage.getItem('prompts')) || defaultPrompts)

  const selectedPrompt = ref(null)

  function updatePrompt(updatedPrompt) {
    const index = prompts.value.findIndex((p) => p.label === updatedPrompt.label)

    if (index !== -1) {
      prompts.value[index] = updatedPrompt
    }

    selectedPrompt.value = updatedPrompt

    localStorage.setItem('prompts', JSON.stringify(prompts.value))
  }

  const chatInput = ref('')
  const inferences = ref([])
  const isInferencing = ref(false)

  function buildPrompt(text) {
    if (!selectedPrompt.value) {
      return `<start_of_turn>user
${text}
<end_of_turn>
<start_of_turn>model`
    }

    return `<start_of_turn>user
${selectedPrompt.value.template}

${text}
<end_of_turn>
<start_of_turn>model`
  }

  async function sendMessage() {
    if (!chatInput.value.trim()) return
    if (!isModelLoaded.value || isInferencing.value || isWarmingUp.value) return

    const userText = chatInput.value
    chatInput.value = ''

    isInferencing.value = true
    const start = performance.now()

    try {
      const result = await repository.generate(buildPrompt(userText))

      inferences.value.push({
        model: selectedModel.value.name,
        task: selectedPrompt.value?.label || 'Normal Chat',
        input: userText,
        output: result.response,
        timeMs: Math.round(performance.now() - start)
      })
    } finally {
      isInferencing.value = false
    }
  }

  function clearAll() {
    inferences.value = []
  }

  async function startRecording() {
    if (isRecording.value) return
    if (!isModelLoaded.value) return

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaRecorder = new MediaRecorder(mediaStream)
      audioChunks = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        isRecording.value = false

        const webmBlob = new Blob(audioChunks, { type: 'audio/webm' })

        const arrayBuffer = await webmBlob.arrayBuffer()

        const audioCtx = new AudioContext()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

        isInferencing.value = true

        const result = await repository.generate([
          '<start_of_turn>user\n',
          'Transcribe the spoken words exactly. Output only the text.\n',
          { audioSource: audioBuffer },
          '\n<end_of_turn>\n<start_of_turn>model\n'
        ])

        chatInput.value = result.response.trim()

        await sendMessage()

        mediaStream.getTracks().forEach((t) => t.stop())
        isInferencing.value = false
      }

      mediaRecorder.start()
      isRecording.value = true
    } catch (err) {
      console.error('Mic error:', err)
      isRecording.value = false
    }
  }

  function stopRecording() {
    if (!mediaRecorder) return
    mediaRecorder.stop()
  }

  return {
    models,
    selectedModel,

    modelLoadTimeMs,
    modelLoadProgress,
    isLoadingModel,
    isModelLoaded,

    isWarmingUp,
    warmupTimeMs,

    loadModel,

    prompts,
    selectedPrompt,
    updatePrompt,

    chatInput,
    inferences,
    sendMessage,
    clearAll,
    isInferencing,
    loadedModelName,
    isRecording,
    startRecording,
    stopRecording
  }
}
