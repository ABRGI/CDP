import { isMatch } from "./reservation";
import "jest"

describe('Reservation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should match based on SSN', async () => {
    expect(isMatch({
      id: 12,
      version: 2,
      reservationCode: 218923718293,
      uuid: "7ab82e89-3183-4d3a-9260-8ffd77a352aa",
      hotelId: 3,
      lang: "FI",
      totalPaid: 99,
      customerFirstName: "Esko",
      customerLastName: "Erehtymätön",
      customerMobile: "+358 40 1234324123",
      customerAddress: "Katu 1 A 3",
      customerPostalCode: "00100",
      customerEmailReal: "esko@gmail.kom",
      customerSsn: "ASJH892132",
      currency: "EUR",
      checkIn: "2020-03-02 14:00:00",
      checkOut: "2020-03-03 10:00:00",
      created: "2020-03-02",
      marketingPermission: true,
      totalPaidExtraForOta: 0,
      state: "CONFIRMED",
      customerIsoCountryCode: "FIN",
      hotel: "HKI2",
      bookingChannel: "",
      cancelled: false,
      isFullyRefunded: false,
      notifyCustomer: false,
      isOverrided: false,
      type: 0,
      breakfastsForAll: false,
      reservationExtraInfo: undefined
    }, {
      id: 12,
      version: 2,
      reservationCode: 218923718293,
      uuid: "7ab82e89-3183-4d3a-9260-8ffd77a352aa",
      hotelId: 3,
      lang: "FI",
      totalPaid: 99,
      customerFirstName: "Esko",
      customerLastName: "Erehtymätö",
      customerMobile: "+358 40 1234324123",
      customerAddress: "Katu 1 A 3",
      customerPostalCode: "00100",
      customerEmailReal: "esko@gmail.com",
      customerSsn: "ASJH892132",
      currency: "EUR",
      checkIn: "2020-03-02 14:00:00",
      checkOut: "2020-03-03 10:00:00",
      created: "2020-03-02",
      marketingPermission: true,
      totalPaidExtraForOta: 0,
      state: "CONFIRMED",
      customerIsoCountryCode: "FIN",
      hotel: "HKI2",
      bookingChannel: "",
      cancelled: false,
      isFullyRefunded: false,
      notifyCustomer: false,
      isOverrided: false,
      type: 0,
      breakfastsForAll: false,
      reservationExtraInfo: undefined
    })).toBeTruthy()
  });
});