import "jest"
import { distanceMoreThan, escapeString } from "./utils";

describe('Utils tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('max distance algorithm', () => {
    expect(distanceMoreThan("", "", 1)).toBe(false)
    expect(distanceMoreThan("a", "", 0)).toBe(true)
    expect(distanceMoreThan("a", "a", 0)).toBe(false)

    expect(distanceMoreThan("abFa", "abCa", 0)).toBe(true)
    expect(distanceMoreThan("abFa", "abCa", 1)).toBe(false)

    expect(distanceMoreThan("testi@gmail.com", "testi@gmail.comi", 0)).toBe(true)
    expect(distanceMoreThan("testi@gmail.com", "testi@gmail.comi", 1)).toBe(false)

    expect(distanceMoreThan("esko.erehtymaton@gmail.com", "esko.erehtymato@gmail.com", 1)).toBe(false)
    expect(distanceMoreThan("esko.erehtymaton@gmail.com", "esko.erehtymato@gmail.comi", 2)).toBe(false)
    expect(distanceMoreThan("esko.erehtymaton@gmail.com", "esko.erehtymato@gmail.comi", 1)).toBe(true)
  })

  test('espace string', () => {
    expect(escapeString(`Boss O'Leary`)).toEqual(`Boss O\\'Leary`)
  })
});