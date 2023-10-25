
export type Voucher = {
  reservationId: number
  voucherId: number
  voucherKey: string
}

const voucherInt = new Set([
  "reservationId", "voucherId"
])


export const mapVoucherValue = (props: { header: string, value: string }): boolean | string | number | undefined | object => {
  const value = props.value.trim()
  if (value === '') {
    return
  }
  if (voucherInt.has(props.header)) {
    return parseInt(value, 10)
  }
  return value
}


export const mapVouchersToReservations = (vouchers: Voucher[]): { [reservationId: string]: Voucher[] } => {
  const reservationMap: { [reservationId: string]: Voucher[] } = {}
  for (const voucher of vouchers) {
    if (!(voucher.reservationId in reservationMap)) {
      reservationMap[voucher.reservationId] = []
    }
    reservationMap[voucher.reservationId].push(voucher)
  }
  return reservationMap
}