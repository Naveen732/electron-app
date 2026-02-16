import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('paths', {
  getModelUrl: (modelFileName) => `app://models/${modelFileName}`,
  getWasmUrl: () => 'app://mediapipe/wasm'
})
contextBridge.exposeInMainWorld('azureAPI', {
  getToken: () => ipcRenderer.invoke('azure:getToken')
})