import { distanceMoreThan } from "./utils"

export type Tree = {
  v?: string,
  t: Map<number, number>
}


export class TreeDictionary {
  tree: any
  matches: Set<string> = new Set()

  constructor() {
    this.tree = new Map<number, any>()
  }

  addStringInternal(str: string, index: number, tree: Map<number, any>) {
    if (index >= str.length) {
      return
    }
    const ch = str.charCodeAt(index)
    if (!tree.has(ch)) {
      let val = tree.get(1) as string
      if (val && index < val.length - 1 && !tree.get(val.charCodeAt(index))) {
        tree.delete(1)
        const next = new Map<number, any>()
        next.set(1, val)
        tree.set(val.charCodeAt(index), next)
      }
      if (!tree.has(ch)) {
        let next = new Map<number, any>()
        tree.set(ch, next)
        next.set(1, str)
      } else
        this.addStringInternal(str, index + 1, tree.get(ch))
    }
    else
      this.addStringInternal(str, index + 1, tree.get(ch))
  }

  addString(str: string) {
    this.addStringInternal(str, 0, this.tree)
  }

  findMatches(str: string, maxDistance: number): string[] {
    this.matches.clear()
    this.findMatchesInternal(str, 0, 0, maxDistance, this.tree)
    return Array.from(this.matches.values())
  }

  findMatchesInternal(str: string, index: number, currDistance: number, maxDistance: number, tree: Map<number, any>) {
    const val = tree.get(1)
    if (val && Math.abs(str.length - val.length) < maxDistance && !distanceMoreThan(str, val, maxDistance)) {
      this.matches.add(val)
    }
    for (let ch of tree.keys()) {
      if (ch !== 1) {
        if (index < str.length && ch === str.charCodeAt(index)) {
          this.findMatchesInternal(str, index + 1, currDistance, maxDistance, tree.get(ch))
        }
        else if (currDistance + 1 <= maxDistance) {
          this.findMatchesInternal(str, index + 1, currDistance + 1, maxDistance, tree)
          this.findMatchesInternal(str, index + 1, currDistance + 1, maxDistance, tree.get(ch))
          this.findMatchesInternal(str, index, currDistance + 1, maxDistance, tree.get(ch))
        }
      }
    }
  }
}