const FAL_API_URL = 'https://queue.fal.run/fal-ai/flux/dev/image-to-image'
const FAL_RESULT_URL = 'https://queue.fal.run/fal-ai/flux/dev/image-to-image/requests'

function getFalKey(): string {
  const key = process.env.FAL_API_KEY
  if (!key) throw new Error('FAL_API_KEY is not set')
  return key
}

export interface FalImageResult {
  url: string
  width: number
  height: number
}

export async function generateProductImageVariant(
  imageBase64: string,
  imageMimeType: string,
  stylePrompt: string,
  strength: number = 0.75
): Promise<FalImageResult | null> {
  try {
    const key = getFalKey()
    const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`

    const submitRes = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageDataUrl,
        prompt: stylePrompt,
        strength,
        num_images: 1,
        image_size: 'portrait_4_3',
        num_inference_steps: 28,
        guidance_scale: 3.5,
        enable_safety_checker: true,
      }),
    })

    if (!submitRes.ok) {
      console.error('fal.ai submit error:', await submitRes.text())
      return null
    }

    const submitData = await submitRes.json()
    const requestId = submitData.request_id
    if (!requestId) {
      console.error('fal.ai: no request_id in response', submitData)
      return null
    }

    const maxAttempts = 30
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000))

      const statusRes = await fetch(`${FAL_RESULT_URL}/${requestId}`, {
        headers: { 'Authorization': `Key ${key}` },
      })
      if (!statusRes.ok) continue

      const statusData = await statusRes.json()

      if (statusData.status === 'COMPLETED') {
        const images = statusData.output?.images
        if (images && images.length > 0) {
          return {
            url: images[0].url,
            width: images[0].width || 768,
            height: images[0].height || 1024,
          }
        }
        return null
      }

      if (statusData.status === 'FAILED') {
        console.error('fal.ai job failed:', statusData)
        return null
      }
      // IN_QUEUE / IN_PROGRESS — keep polling
    }

    console.error('fal.ai: timeout after 60s')
    return null
  } catch (err) {
    console.error('fal.ai error:', err)
    return null
  }
}

// Generate 3 product image variants in parallel:
// 0 = clean white background studio shot
// 1 = lifestyle / in-use scene
// 2 = macro detail / feature highlight
export async function generateFunnelProductImages(
  imageBase64: string,
  imageMimeType: string,
  productName: string,
  productCategory: string
): Promise<(string | null)[]> {
  const prompts = [
    `Professional product photography of ${productName}, pure white background, studio lighting, sharp focus, e-commerce style, no shadows, centered composition, high detail`,
    `${productName} ${productCategory} product in a modern Algerian home lifestyle scene, natural light, clean background, person using the product, warm and inviting, photorealistic`,
    `Macro close-up detail shot of ${productName}, showcasing quality and craftsmanship, soft bokeh background, product photography lighting, sharp details, premium feel`,
  ]

  const results = await Promise.allSettled(
    prompts.map((prompt, i) =>
      generateProductImageVariant(
        imageBase64,
        imageMimeType,
        prompt,
        i === 0 ? 0.65 : 0.80
      )
    )
  )

  return results.map(r => (r.status === 'fulfilled' && r.value ? r.value.url : null))
}
