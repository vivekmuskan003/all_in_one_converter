import axios from 'axios'

// In dev: VITE_API_URL is empty → Vite proxy forwards /api → localhost:5000
// In prod: VITE_API_URL = 'https://your-backend.onrender.com' → direct requests
const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

export async function convertFile(endpoint, file, outputFormat, extra = {}, onProgress) {
  const form = new FormData()
  form.append('file', file)
  form.append('outputFormat', outputFormat)
  Object.entries(extra).forEach(([k, v]) => form.append(k, v))

  // Simulate progress — real server processing can't be tracked via XHR
  let fakeProgress = 0
  const interval = setInterval(() => {
    fakeProgress = Math.min(fakeProgress + Math.random() * 12, 88)
    onProgress && onProgress(Math.round(fakeProgress))
  }, 350)

  try {
    const response = await axios.post(`${BASE}${endpoint}`, form, {
      responseType: 'blob',
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    clearInterval(interval)
    onProgress && onProgress(100)

    const contentDisposition = response.headers['content-disposition']
    let filename = 'converted_file'
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match?.[1]) filename = match[1].replace(/['"]/g, '').trim()
    }

    const url = URL.createObjectURL(new Blob([response.data]))
    return { url, name: filename }

  } catch (err) {
    clearInterval(interval)

    // Server returned an error response — parse the blob to get the message
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text()
        let message = text
        try {
          const json = JSON.parse(text)
          message = json.error || json.message || text
        } catch {
          // text wasn't JSON, use as-is
        }
        throw new Error(message)
      } catch (parseErr) {
        if (parseErr.message && parseErr.message !== '[object Object]') throw parseErr
      }
    }

    if (!err.response) {
      throw new Error('Cannot reach the server. Make sure the backend is running.')
    }

    throw new Error(err.message || 'Conversion failed')
  }
}

// For admin API calls (JSON responses, not blobs)
export async function adminRequest(method, endpoint, data, token) {
  const url = `${BASE}${endpoint}`
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const response = await axios({ method, url, data, headers })
  return response.data
}
