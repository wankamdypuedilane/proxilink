function getApiBaseUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

  if (!apiBaseUrl) {
    throw new Error('La variable VITE_API_URL doit être définie')
  }

  return apiBaseUrl
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/')) {
    throw new Error('Le chemin API doit commencer par /')
  }

  const headers = new Headers(options.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`La requête API a échoué avec le statut ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
