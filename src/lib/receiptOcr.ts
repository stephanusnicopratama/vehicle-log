import { createWorker, type Worker } from 'tesseract.js'

const TESSERACT_VERSION = '5.1.1'
const CORE_CDN = `https://cdn.jsdelivr.net/npm/tesseract.js-core@${TESSERACT_VERSION}`

function workerOptions(onProgress?: (percent: number) => void) {
  const workerPath = `${import.meta.env.BASE_URL}tesseract/worker.min.js`
  return {
    workerPath,
    corePath: CORE_CDN,
    logger: (message: { status?: string; progress?: number }) => {
      if (message.status === 'recognizing text' && onProgress) {
        onProgress(Math.round((message.progress ?? 0) * 100))
      }
    },
  }
}

async function openWorker(
  langs: string,
  onProgress?: (percent: number) => void,
): Promise<Worker> {
  return createWorker(langs, 1, workerOptions(onProgress))
}

export async function recognizeReceiptImage(
  file: Blob,
  onProgress?: (percent: number) => void,
): Promise<string> {
  let worker: Worker | null = null
  try {
    try {
      worker = await openWorker('ind+eng', onProgress)
    } catch {
      worker = await openWorker('eng', onProgress)
    }

    const {
      data: { text },
    } = await worker.recognize(file)
    return text
  } finally {
    if (worker) await worker.terminate()
  }
}
