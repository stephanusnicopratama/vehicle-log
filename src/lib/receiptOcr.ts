import { createWorker } from 'tesseract.js'

const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist'
const TESSDATA_CDN = 'https://tessdata.projectnaptha.com/4.0.0'

export async function recognizeReceiptImage(
  file: Blob,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const worker = await createWorker('ind+eng', 1, {
    workerPath: `${TESSERACT_CDN}/worker.min.js`,
    langPath: TESSDATA_CDN,
    corePath: `${TESSERACT_CDN}/tesseract-core-simd.wasm.js`,
    logger: (message) => {
      if (message.status === 'recognizing text' && onProgress) {
        onProgress(Math.round((message.progress ?? 0) * 100))
      }
    },
  })

  try {
    const {
      data: { text },
    } = await worker.recognize(file)
    return text
  } finally {
    await worker.terminate()
  }
}
