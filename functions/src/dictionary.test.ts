import "jest"
import { TreeDictionary } from "./dictionary";

describe('Dictionary tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('finding matches', () => {
    const dict = new TreeDictionary()
    dict.addString("mika@gmail.com")
    dict.addString("+3585012345678")
    dict.addString("luukas.luukuttaja@gmail.com")
    dict.addString("pertti.hepskukkeli@gmail.com")
    dict.addString("mika@gmail.comi")
    dict.addString("jepas@mail.com")
    dict.addString("jaska.jokunen@icloud.com")

    expect(dict.findMatches("mika@gmail.com", 1)).toEqual(["mika@gmail.com", "mika@gmail.comi"])
    expect(dict.findMatches("mik@gmail.comi", 1)).toEqual(["mika@gmail.comi"])
    expect(dict.findMatches("joku@olematon.com", 3)).toEqual([])

    expect(dict.findMatches("+3584012345678", 0)).toEqual([])
    expect(dict.findMatches("+3584012345678", 1)).toEqual(["+3585012345678"])

    expect(dict.findMatches("mika@gmail.con", 1)).toEqual(["mika@gmail.com"])
    expect(dict.findMatches("mika@gmail.cpm", 1)).toEqual(["mika@gmail.com"])
    expect(dict.findMatches("mika@gmail.von", 2)).toEqual(["mika@gmail.com"])
    expect(dict.findMatches("mika@gmaill.com", 1)).toEqual(["mika@gmail.com"])
    expect(dict.findMatches("mika@hmail.com", 1)).toEqual(["mika@gmail.com"])
    expect(dict.findMatches("mika@gmaiil.com", 1)).toEqual(["mika@gmail.com"])
    expect(dict.findMatches("jaska.jokunen@icooud.com", 2)).toEqual(["jaska.jokunen@icloud.com"])

    // is spelled.con or.vom or.cpm; gmail is spelled hmail or gmaill or gmaiil, icloud spelled icooud etc.

  })
});