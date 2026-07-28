// Scale an image down to fit inside a box while keeping its natural aspect
// ratio. jsPDF's addImage stretches the image to whatever width/height it is
// given, so callers must compute the fitted size themselves or signatures and
// logos come out distorted.
export async function fitImageToBox(
  src: string,
  maxWidth: number,
  maxHeight: number
): Promise<{ width: number; height: number }> {
  const { naturalWidth, naturalHeight } = await new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        resolve(img)
      }
      img.onerror = () => {
        reject(new Error(`Unable to load image: ${src}`))
      }
      img.src = src
    }
  )

  if (!naturalWidth || !naturalHeight) {
    return { width: maxWidth, height: maxHeight }
  }

  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight)

  return { width: naturalWidth * scale, height: naturalHeight * scale }
}
