import "jest"
import { Dictionary } from "./dictionary";

describe('Dictionary tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('finding matches', () => {
    const dict = new Dictionary()
    dict.addString("mika@gmail.com")
    dict.addString("+3585012345678")
    dict.addString("luukas.luukuttaja@gmail.com")
    dict.addString("pertti.hepskukkeli@gmail.com")
    dict.addString("mika@gmail.comi")
    dict.addString("jepas@mail.com")

    expect(dict.findMatches("mika@gmail.com", 1)).toEqual(["mika@gmail.com", "mika@gmail.comi"])
    expect(dict.findMatches("mik@gmail.comi", 1)).toEqual(["mika@gmail.comi"])
    expect(dict.findMatches("joku@olematon.com", 3)).toEqual([])

    expect(dict.findMatches("+3584012345678", 0)).toEqual([])
    expect(dict.findMatches("+3584012345678", 1)).toEqual(["+3585012345678"])
  })
});