
export type Price = {
  reservationId: number
  totalPrice: number
}
export const mapPriceValue = (props: { header: string, value: string }): boolean | string | number | undefined | object => {
  const value = props.value.trim()
  if (value === '') {
    return
  }
  if (props.header === "reservationId") {
    return parseInt(value, 10)
  }
  if (props.header === "totalPrice") {
    return parseFloat(value)
  }
  throw Error(`Unknown header in prices: ${props.header}`)
}


export const mapPricesToReservations = (prices: Price[]): { [reservationId: number]: Price } => {
  const reservationMap: { [reservationId: number]: Price } = {}
  for (const price of prices) {
    reservationMap[price.reservationId] = price
  }
  return reservationMap
}