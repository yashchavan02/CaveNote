const MAGIC_BYTES = new Uint8Array([0x43, 0x56, 0x4e, 0x54])
const HEADER_LEN = 8
const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024

function strToBytes(str) {
  return new TextEncoder().encode(str)
}

function bytesToStr(bytes) {
  return new TextDecoder().decode(bytes)
}

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/

function isValidBase64(str) {
  return typeof str === 'string' && str.length > 0 && str.length % 4 === 0 && BASE64_RE.test(str)
}

function countUsableChannels(pixels) {
  let count = 0
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] === 255) count += 3
  }
  return count
}

export function buildPayload(encryptedData) {
  const body = strToBytes(JSON.stringify(encryptedData))
  const payload = new Uint8Array(HEADER_LEN + body.length)
  payload.set(MAGIC_BYTES, 0)
  new DataView(payload.buffer).setUint32(4, body.length, false)
  payload.set(body, HEADER_LEN)
  return payload
}

export function hasMagic(bytes) {
  if (!bytes || bytes.length < 4) return false
  for (let i = 0; i < 4; i++) {
    if (bytes[i] !== MAGIC_BYTES[i]) return false
  }
  return true
}

export function parsePayload(rawBytes) {
  try {
    if (!rawBytes || rawBytes.length < HEADER_LEN || !hasMagic(rawBytes)) return null
    const view = new DataView(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength)
    const length = view.getUint32(4, false)
    if (length <= 0 || length > MAX_PAYLOAD_BYTES || HEADER_LEN + length > rawBytes.length) return null
    const obj = JSON.parse(bytesToStr(rawBytes.slice(HEADER_LEN, HEADER_LEN + length)))
    if (!obj || typeof obj.ciphertext !== 'string' || !isValidBase64(obj.ciphertext)) {
      return null
    }
    return { ciphertext: obj.ciphertext }
  } catch {
    return null
  }
}

export function embedLSB(pixels, data) {
  if (!pixels || !data) return false
  const totalBits = data.length * 8
  if (totalBits > countUsableChannels(pixels)) return false

  const isWritable = (i) => i % 4 !== 3 && pixels[i | 3] === 255

  let p = 0
  for (let i = 0; i < data.length; i++) {
    const byte = data[i]
    for (let bit = 7; bit >= 0; bit--) {
      while (p < pixels.length && !isWritable(p)) p++
      if (p >= pixels.length) return false
      pixels[p] = (pixels[p] & 0xfe) | ((byte >> bit) & 1)
      p++
    }
  }
  return true
}

export function extractLSB(pixels) {
  if (!pixels) return null
  const usable = countUsableChannels(pixels)
  if (usable < HEADER_LEN * 8) return null

  let bitPos = 0

  const readBit = () => {
    let p = bitPos
    while (p < pixels.length && !(p % 4 !== 3 && pixels[p | 3] === 255)) p++
    if (p >= pixels.length) return null
    bitPos = p + 1
    return pixels[p] & 1
  }

  const readByte = () => {
    let byte = 0
    for (let bit = 0; bit < 8; bit++) {
      const b = readBit()
      if (b === null) return null
      byte = (byte << 1) | b
    }
    return byte
  }

  const header = new Uint8Array(HEADER_LEN)
  for (let i = 0; i < HEADER_LEN; i++) {
    const b = readByte()
    if (b === null) return null
    header[i] = b
  }

  if (!hasMagic(header)) return null

  const length = new DataView(header.buffer).getUint32(4, false)
  if (length <= 0 || length > MAX_PAYLOAD_BYTES) return null
  if (HEADER_LEN + length > usable) return null

  const body = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    const b = readByte()
    if (b === null) return null
    body[i] = b
  }

  const raw = new Uint8Array(HEADER_LEN + length)
  raw.set(header, 0)
  raw.set(body, HEADER_LEN)
  return parsePayload(raw)
}

function drawImageToCanvas(imageEl) {
  const canvas = document.createElement('canvas')
  const width = imageEl.naturalWidth || imageEl.width
  const height = imageEl.naturalHeight || imageEl.height
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(imageEl, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  return { canvas, ctx, imageData }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to encode PNG image'))
    }, 'image/png')
  })
}

export async function embedNoteInImage(imageEl, encryptedData) {
  const { canvas, ctx, imageData } = drawImageToCanvas(imageEl)
  const payload = buildPayload(encryptedData)
  if (!embedLSB(imageData.data, payload)) {
    throw new Error(
      'This image is too small to hold the note. Use a larger image (minimum 400×400 recommended).'
    )
  }
  ctx.putImageData(imageData, 0, 0)
  return canvasToBlob(canvas)
}

export async function extractNoteFromImage(imageEl) {
  const { imageData } = drawImageToCanvas(imageEl)
  return extractLSB(imageData.data)
}

export async function hasSteganoData(imageEl) {
  const { imageData } = drawImageToCanvas(imageEl)
  const pixels = imageData.data
  let p = 0
  const magic = new Uint8Array(4)
  for (let i = 0; i < 4; i++) {
    for (let bit = 0; bit < 8; bit++) {
      while (p < pixels.length && !(p % 4 !== 3 && pixels[p | 3] === 255)) p++
      if (p >= pixels.length) return false
      magic[i] = (magic[i] << 1) | (pixels[p] & 1)
      p++
    }
  }
  return hasMagic(magic)
}
