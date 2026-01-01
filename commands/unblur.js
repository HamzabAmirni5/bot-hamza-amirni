// instagram.com/noureddine_ouafy

const axios = require('axios')
const https = require('https')
const FormData = require('form-data')

class UnblurAI {
  constructor() {
    this.apiBase = "https://api.unblurimage.ai/api"
    this.endpoints = {
      UNBLUR: "/imgupscaler/v2/ai-image-unblur/create-job",
      UPSCALE: "/imgupscaler/v2/ai-image-upscale/create-job",
      MILD: "/imgupscaler/v2/ai-image-mild-unblur/create-job",
      STATUS: "/imgupscaler/v2/ai-image-unblur/get-job"
    }
    this.headers = {
      "product-code": "067003",
      "product-serial": `device-${Date.now()}-${Math.random().toString(36).slice(7)}`,
      accept: "*/*",
      "user-agent": "Postify/1.0.0"
    }
  }

  async fetchImageBuffer(imageURL) {
    const { data } = await axios.get(imageURL, {
      responseType: "arraybuffer",
      headers: { accept: "image/*", "user-agent": "Postify/1.0.0" },
      httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
      timeout: 15000
    })
    return Buffer.from(data);
  }

  async processImage({ url, buffer, mode = "UNBLUR", scaleFactor = "2" }) {
    let imageBuffer = buffer;
    if (!imageBuffer && url) {
      imageBuffer = await this.fetchImageBuffer(url);
    }
    if (!imageBuffer) throw new Error("No image data provided");

    const formData = new FormData()
    formData.append("original_image_file", imageBuffer, { filename: "image.png", contentType: "image/png" })

    if (mode === "UPSCALE") {
      formData.append("scale_factor", scaleFactor)
      formData.append("upscale_type", "image-upscale")
    }

    const reqUrl = `${this.apiBase}${this.endpoints[mode]}`

    // axios with form-data automatically sets headers if we pass the form
    const response = await axios.post(reqUrl, formData, {
      headers: { ...this.headers, ...formData.getHeaders() },
      httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
      timeout: 20000
    })

    const jobId = response?.data?.result?.job_id
    return jobId ? await this.checkJobStatus(jobId) : { status: false }
  }

  async checkJobStatus(jobId) {
    const url = `${this.apiBase}${this.endpoints.STATUS}/${jobId}`
    const start = Date.now()
    while (Date.now() - start < 60000) {
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 5000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true })
      })
      const data = response.data
      if (data?.code === 100000 && data.result?.output_url?.[0]) {
        return { status: true, url: data.result.output_url[0] }
      }
      if (data?.code !== 300006) break
      await new Promise(r => setTimeout(r, 3000))
    }
    return { status: false }
  }
}

let handler = async (sock, chatId, msg, args) => {
  let imageBuffer;

  // 1. Check if user is replying to an image
  let q = msg.quoted ? msg.quoted : msg;
  let mime = (q.msg || q).mimetype || '';
  if (/image/.test(mime)) {
    imageBuffer = await q.download();
  }
  // 2. Check if user provided a URL
  else if (args && args[0] && args[0].startsWith('http')) {
    // Logic handled by the class via URL, but we can just pass URL to it.
    // But passing buffer is easier for unified logic.
    // Actually let's just pass what we have.
  }
  else {
    return sock.sendMessage(chatId, { text: "⚠️ Please reply to an image or provide a valid image URL." }, { quoted: msg });
  }

  await sock.sendMessage(chatId, { text: "⏳ Enhancing image... please wait." }, { quoted: msg });

  const unblurAI = new UnblurAI()
  try {
    const result = await unblurAI.processImage({ url: args[0], buffer: imageBuffer, mode: "UNBLUR" })
    if (!result.status) throw 'Failed to enhance image. Try again.'
    await sock.sendFile(chatId, result.url, 'unblurred.png', '✅ Image Enhanced Successfully', msg)
  } catch (e) {
    console.error(e)
    await sock.sendMessage(chatId, { text: '❌ Error processing image.' }, { quoted: msg });
  }
}

handler.help = ['unblur']
handler.tags = ['ai']
handler.command = /^unblur$/i
handler.limit = true;
module.exports = handler;
