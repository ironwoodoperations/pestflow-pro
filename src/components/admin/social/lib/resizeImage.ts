// Resize an uploaded image to social-friendly dimensions before upload.
// Targets 1200px on the longest edge, JPEG quality 0.82.
// Reduces a 5MB iPhone JPEG to roughly 200-400 KB and matches Facebook's
// recommended dimensions.
export async function resizeImage(
  file: File,
  maxPx = 1200,
  quality = 0.82
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height))
  const canvas = new OffscreenCanvas(
    Math.round(bitmap.width * scale),
    Math.round(bitmap.height * scale)
  )
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2d canvas context')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.convertToBlob({ type: 'image/jpeg', quality })
}
