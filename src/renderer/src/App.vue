<script>
import { defineComponent, onMounted } from 'vue'
import { useChatViewModel } from './viewmodels/chatViewModel'
import ChatView from './views/chatview.vue'

export default defineComponent({
  components: { ChatView },

  setup() {

    const vm = useChatViewModel()

    if (vm.init) {
      onMounted(vm.init)
    }

    return vm
  }
})
</script>

<template>
  <ChatView
    :models="models"
    :selectedModel="selectedModel"

    :modelLoadTimeMs="modelLoadTimeMs"
    :modelLoadProgress="modelLoadProgress"
    :isLoadingModel="isLoadingModel"
    :isModelLoaded="isModelLoaded"
    :isWarmingUp="isWarmingUp"
    :warmupTimeMs="warmupTimeMs"
    :loadedModelName="loadedModelName"

    :prompts="prompts"
    :selectedPrompt="selectedPrompt"

    :chatInput="chatInput"
    :inferences="inferences"

    :isRecording="isRecording"
    :isInferencing="isInferencing"

    @update:chatInput="chatInput = $event"
    @update:selectedModel="selectedModel = $event"
    @update:selectedPrompt="selectedPrompt = $event"

    @updatePrompt="updatePrompt"   

    @loadModel="loadModel"
    @send="sendMessage"

    @startRecording="startRecording"
    @stopRecording="stopRecording"

    @clearAll="clearAll"           
  />
</template>
