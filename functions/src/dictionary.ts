import { distanceMoreThan } from "./utils"

export class Dictionary {
  strings: { [length: number]: string[] }

  constructor() {
    this.strings = {}
  }

  addString(str: string) {
    if (!(str.length in this.strings)) {
      this.strings[str.length] = []
    }
    this.strings[str.length].push(str)
  }

  findMatches(str: string, maxDistance: number): string[] {
    const matches: string[] = []

    for (let l = str.length - maxDistance; l <= str.length + maxDistance; l++) {
      if (l in this.strings) {
        for (const currStr of this.strings[l]) {
          if (currStr === str || !distanceMoreThan(str, currStr, maxDistance)) {
            matches.push(currStr)
          }
        }
      }
    }
    return matches;
  }
}