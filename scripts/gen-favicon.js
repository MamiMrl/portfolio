import sharp from 'sharp'
import toIco from 'to-ico'
import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TEXTURE = join(ROOT, 'public/textures/earth-night.jpg')
const OUT = join(ROOT, 'public')

// 20°E, 45°N in a 4096×2048 equirectangular texture
const CX = Math.round((20 + 180) / 360 * 4096)  // ≈ 2275
const CY = Math.round((90 - 45) / 180 * 2048)   // ≈ 512
const CROP = 800

function rawToBuffer(size, fillFn) {
  const data = new Uint8Array(size * size * 4)
  const half = size / 2
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      fillFn(data, (y * size + x) * 4, x - half, y - half, Math.sqrt((x - half) ** 2 + (y - half) ** 2), half)
  return sharp(Buffer.from(data.buffer), { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toBuffer()
}

// Anti-aliased white circle mask for dest-in clipping
function circleMask(size) {
  return rawToBuffer(size, (d, i, _dx, _dy, dist, r) => {
    const a = dist <= r - 0.5 ? 255 : dist >= r + 0.5 ? 0 : Math.round((r + 0.5 - dist) * 255)
    d[i] = d[i + 1] = d[i + 2] = 255
    d[i + 3] = a
  })
}

// Dark radial vignette — sells the sphere curvature
function sphereShade(size) {
  return rawToBuffer(size, (d, i, _dx, _dy, dist, r) => {
    if (dist >= r) return
    d[i] = 5; d[i + 1] = 3; d[i + 2] = 9
    d[i + 3] = Math.round(Math.pow(dist / r, 2.2) * 0.72 * 255)
  })
}

// Soft purple rim — matches site --glow: #9a7bff
function atmosGlow(size) {
  return rawToBuffer(size, (d, i, _dx, _dy, dist, r) => {
    const w = Math.max(1.5, r * 0.04)
    const inner = r - 2 * w
    if (dist >= r || dist < inner) return
    const t = (dist - inner) / (2 * w)       // 0→1 across glow band
    const bell = 4 * t * (1 - t)             // peak at t = 0.5
    d[i] = 154; d[i + 1] = 123; d[i + 2] = 255
    d[i + 3] = Math.round(bell * 0.38 * 255)
  })
}

async function renderGlobe(size) {
  const [mask, shade, glow] = await Promise.all([
    circleMask(size),
    sphereShade(size),
    atmosGlow(size),
  ])

  const cropped = await sharp(TEXTURE)
    .extract({ left: CX - CROP / 2, top: CY - CROP / 2, width: CROP, height: CROP })
    .resize(size, size, { kernel: 'lanczos3' })
    .png()
    .toBuffer()

  const clipped = await sharp(cropped)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()

  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 5, g: 3, b: 9, alpha: 1 } },
  })
    .composite([{ input: clipped }, { input: shade }, { input: glow }])
    .png()
    .toBuffer()
}

const [g16, g32, g180] = await Promise.all([renderGlobe(16), renderGlobe(32), renderGlobe(180)])

await Promise.all([
  writeFile(join(OUT, 'favicon-16x16.png'), g16),
  writeFile(join(OUT, 'favicon-32x32.png'), g32),
  writeFile(join(OUT, 'apple-touch-icon.png'), g180),
  toIco([g16, g32]).then(buf => writeFile(join(OUT, 'favicon.ico'), buf)),
])

console.log('✓ favicon-16x16.png')
console.log('✓ favicon-32x32.png')
console.log('✓ apple-touch-icon.png')
console.log('✓ favicon.ico')
