<script>
export default {

  props: [
    'models','selectedModel','modelLoadTimeMs','modelLoadProgress',
    'isLoadingModel','isModelLoaded','loadedModelName',
    'prompts','selectedPrompt',
    'chatInput','inferences',
    'isRecording','isInferencing','isWarmingUp'
  ],

  emits: [
    'update:selectedModel','update:selectedPrompt',
    'update:chatInput','loadModel','send',
    'startRecording','stopRecording','clearAll',
    'updatePrompt'
  ],

  data() {
    return {
      showPromptEditor: false,
      editingPrompt: null,
      editablePromptText: ''
    }
  },
watch: {
  isInferencing(val) {
    if (!val) {
      this.$nextTick(() => {
        const el = this.$refs.chatContainer
        el?.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        })
      })
    }
  }
},



  computed: {

    isCurrentModelLoaded() {
      return this.isModelLoaded &&
             this.selectedModel?.name === this.loadedModelName
    },

    isPromptEnabled() {
      return this.isCurrentModelLoaded &&
             !this.isLoadingModel &&
             !this.isWarmingUp
    },

    isChatEnabled() {
      return this.isCurrentModelLoaded && this.selectedPrompt
    }
  },

  methods: {

    handleInput(e) {
      this.$emit('update:chatInput', e.target.value)

      this.$nextTick(() => {
        const el = this.$refs.chatInputBox
        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'
      })
    },

    openPromptEditor(prompt) {
      this.editingPrompt = prompt
      this.editablePromptText = prompt.template
      this.showPromptEditor = true
    },

    savePrompt() {
      this.$emit('updatePrompt', {
        ...this.editingPrompt,
        template: this.editablePromptText
      })

      this.showPromptEditor = false
    }
  }
}
</script>

<template>
<div class="h-screen flex bg-gray-100">

  <!-- SIDEBAR -->
  <aside class="w-64 bg-white border-r flex flex-col">

    <div class="px-6 py-4 text-lg font-semibold">
      LLM chat app
    </div>

    <!-- MODEL SECTION -->
    <div class="p-4 space-y-3">

      <label class="text-xs text-gray-500">MODEL</label>

      <select
        :value="selectedModel?.name"
        @change="$emit('update:selectedModel',
          models.find(m => m.name === $event.target.value))"
        class="w-full border rounded-lg px-3 py-2 text-sm"
      >
        <option v-for="m in models" :key="m.name" :value="m.name">
          {{ m.name }}
        </option>
      </select>

      <button
        @click="$emit('loadModel')"
        :disabled="isLoadingModel || isCurrentModelLoaded"
        class="w-full py-2 rounded-lg text-white transition
               disabled:opacity-50 disabled:cursor-not-allowed"
        :class="isCurrentModelLoaded
          ? 'bg-green-600'
          : 'bg-blue-600 hover:bg-blue-700'"
      >
        <span v-if="isLoadingModel">
          Loading {{ modelLoadProgress }}%
        </span>

        <span v-else-if="isCurrentModelLoaded">
          ✅ Model Loaded
        </span>

        <span v-else>
          Load Model
        </span>
      </button>

      <div v-if="isLoadingModel" class="bg-gray-200 h-2 rounded">
        <div
          class="bg-blue-600 h-2 rounded"
          :style="{ width: modelLoadProgress + '%' }"
        />
      </div>

      <div v-if="modelLoadTimeMs" class="text-xs text-gray-500">
        Load Time: {{ modelLoadTimeMs }} ms
      </div>

    </div>

    <!-- PROMPTS -->
    <div class="px-4 flex-1 overflow-y-auto">

      <label class="text-xs text-gray-500 block mb-2">PROMPTS</label>

      <div
        v-for="p in prompts"
        :key="p.label"
        class="flex items-center gap-2 mb-2"
      >

        <!-- SELECT -->
        <button
          @click="$emit('update:selectedPrompt', p)"
          :disabled="!isPromptEnabled"
          class="flex-1 text-left px-3 py-2 rounded-lg text-sm"
          :class="selectedPrompt?.label === p.label
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100'"
        >
          {{ p.label }}
        </button>

        <!-- EDIT -->
        <button
          @click="openPromptEditor(p)"
          :disabled="!isPromptEnabled"
          class="px-2 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ✏
        </button>

      </div>

    </div>

    <div class="p-4">
      <button
        @click="$emit('clearAll')"
        class="w-full bg-red-500 text-white py-2 rounded-lg"
      >
        Remove All
      </button>
    </div>

  </aside>

  <!-- MAIN CHAT AREA -->
  <div  class="flex-1 flex flex-col">
    <header class="bg-white px-6 py-4 text-center"> 
      <h1 class="text-xl font-semibold">Welcome to LLM chat app</h1> 
      <p class="text-sm text-gray-500"> Start a new chat </p> 
    </header>
    <main ref = "chatContainer" class="flex-1 overflow-y-auto p-6 space-y-6">

      <div
        v-for="(inf, i) in inferences"
        :key="i"
        class="bg-white rounded-xl border p-5"
      >
        <div class="text-xs mb-2 flex justify-between">
          <div class="flex gap-2">
            <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {{ inf.model }}
            </span>
            <span class="bg-green-100 text-green-700 px-2 py-1 rounded">
              {{ inf.task }}
            </span>
          </div>

          ⏱ {{ inf.timeMs }} ms
        </div>

        <div class="bg-gray-100 p-3 rounded mb-2 text-sm">
          {{ inf.input }}
        </div>

        <div class="bg-green-50 border p-3 rounded text-sm">
          {{ inf.output }}
        </div>
      </div>

      <div v-if="isInferencing" class="text-gray-500 text-sm">
        🤖 Model is thinking...
      </div>

    </main>

    <!-- INPUT -->
    <footer class="bg-white p-4">

      <div class="flex items-end gap-2 border rounded-xl px-3 py-2">

        <textarea
          ref="chatInputBox"
          rows="1"
          :value="chatInput"
          @input="handleInput"
          @keydown.enter.exact.prevent="$emit('send')"
          @keydown.shift.enter.stop
          :disabled="!isChatEnabled"
          placeholder="Type your prompt here..."
          class="flex-1 resize-none overflow-y-auto max-h-40 focus:outline-none"
        />

        <button
  @click="$emit(isRecording ? 'stopRecording' : 'startRecording')"
  :disabled="!isChatEnabled"
  class="relative group flex items-center justify-center
         w-12 h-12 rounded-full
         bg-white shadow-md
         hover:bg-gray-100
         transition
         disabled:opacity-40 disabled:cursor-not-allowed"
  :class="isRecording ? 'ring-4 ring-blue-300' : ''"
>

  <!-- IDLE ICON -->
  <svg
    v-if="!isRecording"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    class="w-5 h-5 text-gray-700"
  >
    <path d="M12 3a1 1 0 011 1v8a1 1 0 11-2 0V4a1 1 0 011-1zm4 3a1 1 0 011 1v6a5 5 0 01-10 0V7a1 1 0 112 0v6a3 3 0 006 0V7a1 1 0 011-1zM5 13a1 1 0 011 1 6 6 0 0012 0 1 1 0 112 0 8 8 0 01-7 7.938V23h3a1 1 0 110 2H8a1 1 0 110-2h3v-1.062A8 8 0 014 14a1 1 0 011-1z"/>
  </svg>


  <div v-else class="flex items-end gap-[3px] h-5">
    <span class="w-[3px] h-full bg-gray-800 rounded animate-bounce"></span>
    <span class="w-[3px] h-full bg-gray-800 rounded animate-bounce delay-150"></span>
    <span class="w-[3px] h-full bg-gray-800 rounded animate-bounce delay-300"></span>
  </div>

  <!-- TOOLTIP -->
  <span
    class="absolute -top-9 scale-0 group-hover:scale-100
           bg-black text-white text-xs px-2 py-1 rounded
           transition origin-bottom whitespace-nowrap"
  >
    {{ isRecording ? 'Stop recording' : 'Use voice' }}
  </span>

</button>


        <button
          @click="$emit('send')"
          :disabled="!isChatEnabled || isInferencing || isWarmingUp"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-40"
        >
          Send
        </button>

      </div>

    </footer>

  </div>

  <!-- PROMPT MODAL -->
  <div
    v-if="showPromptEditor"
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  >
    <div class="bg-white w-[600px] max-w-full rounded-xl p-6 space-y-4">

      <h2 class="text-lg font-semibold">
        Edit Prompt – {{ editingPrompt?.label }}
      </h2>

      <textarea
        v-model="editablePromptText"
        rows="10"
        class="w-full border rounded-lg p-3 text-sm"
      />

      <div class="flex justify-end gap-2">
        <button
          @click="showPromptEditor = false"
          class="px-4 py-2 bg-gray-200 rounded-lg"
        >
          Cancel
        </button>

        <button
          @click="savePrompt"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Save
        </button>
      </div>

    </div>
  </div>

</div>
</template>
