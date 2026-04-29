export function useNominatim() {
  async function searchAddress(
    query: string,
  ): Promise<{ lat: number; lng: number; label: string } | null> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'trivio-app' } })
    if (!res.ok) return null
    const data = (await res.json()) as Array<{
      lat: string
      lon: string
      display_name: string
    }>
    if (!data.length || !data[0]) return null
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      label: data[0].display_name,
    }
  }

  async function reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'trivio-app' } })
      if (!res.ok) return null
      const data = (await res.json()) as {
        display_name?: string
        address?: {
          road?: string
          suburb?: string
          city?: string
          town?: string
          state?: string
        }
      }
      if (!data.address) return data.display_name ?? null
      const { road, suburb, city, town, state } = data.address
      const parts = [road, suburb, city ?? town, state].filter(Boolean)
      return parts.length ? parts.join(', ') : (data.display_name ?? null)
    } catch {
      return null
    }
  }

  return { searchAddress, reverseGeocode }
}
