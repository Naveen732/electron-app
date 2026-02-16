# electron-app

An Electron desktop application built with Vue that supports:

* Offline LLM inference (Gemma / TranslateGemma)
* Real-time Speech-to-Text using Azure
* Prompt-based AI transformations
* Local model loading with warmup

---

## Recommended IDE Setup

* [VSCode](https://code.visualstudio.com/)
* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
* [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
* [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

---

## Project Setup

### Install

```bash
npm install
```

---

### Environment Configuration

Create a `.env` file in the project root:

```
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=your_region
```

---

### Model Setup

Place all LLM model files inside:

```
resources/models/
```

Example:

```
resources/models/gemma-3n-E2B-it-int4-Web.litertlm
resources/models/gemma-3n-E4B-it-int4-Web.litertlm
resources/models/translategemma-4b-it-int8-web.task
```

---

### Development

```bash
npm run dev
```

---

### Build

```bash
# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

---

## First Time Usage

1. Select a model
2. Click **Load Model**
3. Wait for warmup
4. Start chatting or use the microphone

---

## Notes

* Microphone permission is required for Speech-to-Text
* Do not commit the `.env` file
