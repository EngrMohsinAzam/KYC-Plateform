export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("kyc_admin_token")
}

export const setStoredToken = (token: string): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("kyc_admin_token", token)
}

export const clearStoredToken = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("kyc_admin_token")
}

export const API_BASE_URL = "https://xzfjrnv9-3099.asse.devtunnels.ms/"

export async function loginAdmin(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    throw new Error("Invalid credentials")
  }

  const data = await response.json()
  return data.data.token
}

export async function fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401) {
    clearStoredToken()
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  return response
}
