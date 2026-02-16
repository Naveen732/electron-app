import { app, BrowserWindow, protocol, Menu, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import dotenv from 'dotenv'

dotenv.config()

app.commandLine.appendSwitch('enable-unsafe-webgpu')
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('force-high-performance-gpu')
app.commandLine.appendSwitch('ignore-gpu-blocklist')

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      
    }
  }
])

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      autoHideMenuBar: true
    }
    
  })
  
  Menu.setApplicationMenu(null)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
if (process.platform === 'darwin') {
  app.disableHardwareAcceleration()
}

app.whenReady().then(() => {
  protocol.handle('app', async (request) => {
    try {
      const url = new URL(request.url)

      let pathname = path.join(url.hostname, decodeURIComponent(url.pathname))

      if (pathname.startsWith('\\') || pathname.startsWith('/')) {
        pathname = pathname.slice(1)
      }

      const basePath = app.isPackaged
        ? process.resourcesPath
        : path.join(process.cwd(), 'resources')

      const filePath = path.join(basePath, pathname)

      if (!fs.existsSync(filePath)) {
        console.error('File NOT found:', filePath)
        return new Response(null, { status: 404 })
      }

      const stat = fs.statSync(filePath)
      const range = request.headers.get('range')

      if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
        const start = parseInt(startStr, 10)
        const end = endStr ? parseInt(endStr, 10) : stat.size - 1

        const stream = fs.createReadStream(filePath, { start, end })

        return new Response(stream, {
          status: 206,
          headers: {
            'Content-Type': getMimeType(filePath),
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': (end - start + 1).toString()
          }
        })
      }

      return new Response(fs.createReadStream(filePath), {
        headers: {
          'Content-Type': getMimeType(filePath),
          'Content-Length': stat.size.toString()
        }
      })
    } catch (err) {
      console.error('Protocol error:', err)
      return new Response(null, { status: 500 })
    }
  })
  ipcMain.handle('azure:getToken', async () => {
  const region = process.env.AZURE_SPEECH_REGION
  const key = process.env.AZURE_SPEECH_KEY

  const response = await fetch(
    `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key
      }
    }
  )

  const token = await response.text()

  return { token, region }
})

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function getMimeType(filePath) {
  if (filePath.endsWith('.wasm')) return 'application/wasm'
  if (filePath.endsWith('.js')) return 'application/javascript'
  if (filePath.endsWith('.task')) return 'application/octet-stream'
  if (filePath.endsWith('.litertlm')) return 'application/octet-stream'
  return 'application/octet-stream'
}
