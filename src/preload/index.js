import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('paths', {
  getModelUrl: (modelFileName) => `app://models/${modelFileName}`,
  getWasmUrl: () => 'app://mediapipe/wasm'
})
