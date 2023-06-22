import "jest"
import { createCustomerFromReservation } from "./reservation";
import { generateNewReservation } from "./test/utils";
import { Customer, calculateCustomerMatchPoints } from "./customer";

describe('Customer tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('Test match point calculation', () => {
    const customer = createCustomerFromReservation(generateNewReservation())
    expect(calculateCustomerMatchPoints(customer as Customer, customer?.ssn, customer?.email, customer?.phoneNumber,
      customer?.firstName, customer?.lastName)).toBeCloseTo(4.0)

    expect(calculateCustomerMatchPoints(customer as Customer, undefined, customer?.email, customer?.phoneNumber,
      customer?.firstName, customer?.lastName)).toBeCloseTo(3.0)

    expect(calculateCustomerMatchPoints(customer as Customer, "not-matching", customer?.email, customer?.phoneNumber,
      customer?.firstName, customer?.lastName)).toBeCloseTo(1.5)

    expect(calculateCustomerMatchPoints(customer as Customer, "not-matching", "not-matching", "not-matching",
      "not-matching", customer?.lastName)).toBeCloseTo(-4.5)
  })

  test('Test partial match point calculation', () => {
    const customer = createCustomerFromReservation(generateNewReservation())
    expect(calculateCustomerMatchPoints(customer as Customer,
      customer?.ssn, customer?.email + "a", customer?.phoneNumber + "a",
      customer?.firstName + "a", customer?.lastName)).toBeCloseTo(4.0)

    expect(calculateCustomerMatchPoints(customer as Customer,
      customer?.ssn, customer?.email + "a", customer?.phoneNumber + "a",
      customer?.firstName + "a", customer?.lastName + "a")).toBeCloseTo(2.0)
  })
});