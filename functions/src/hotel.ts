export type HotelCounts = { hotel: string, count: number }[]

/**
 * Calculates the sum of hotels counts from two arrays
 * @param first First array
 * @param second Second array
 * @returns Merged array with counts summed
 */
export const mergeHotelCounts = (first: HotelCounts, second: HotelCounts): HotelCounts => {
  const hotels = new Set(first.concat(second).map(h => h.hotel))

  const merged: HotelCounts = []
  for (const hotel of hotels.values()) {
    merged.push({
      hotel, count: (first.find(h => h.hotel === hotel)?.count || 0) +
        (second.find(h => h.hotel === hotel)?.count || 0)
    })
  }
  return merged
}