import axios from 'axios'

const TOKEN_STORAGE_KEY = 'token'
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const baseURL = configuredApiUrl
  ? configuredApiUrl.replace(/\/$/, '')
  : 'http://localhost:3000/api'

const apiClient = axios.create({
  baseURL,
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)

    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
