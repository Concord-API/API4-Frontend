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

  return { searchAddress }
}
