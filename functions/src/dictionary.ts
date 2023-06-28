
export type Tree = {
  v?: string,
  t: Map<number, number>
}


export class TreeDictionary {
  tree: any
  matches: string[] = []

  constructor() {
    this.tree = new Map<number, any>()
  }

  addStringInternal(str: string, index: number, tree: Map<number, any>) {
    if (index >= str.length) {
      return
    }
    const ch = str.charCodeAt(index)
    if (!tree.has(ch)) {
      let next = new Map<number, any>()
      tree.set(ch, next)
      if (index === str.length - 1) next.set(1, str)
      this.addStringInternal(str, index + 1, next)
    }
    else
      this.addStringInternal(str, index + 1, tree.get(ch))
  }

  addString(str: string) {
    this.addStringInternal(str, 0, this.tree)
  }

  findMatches(str: string, maxDistance: number): string[] {
    this.matches = []
    this.findMatchesInternal(str, 0, 0, maxDistance, this.tree)
    return this.matches
  }

  findMatchesInternal(str: string, index: number, currDistance: number, maxDistance: number, tree: Map<number, any>) {
    if (tree.has(1) && index === str.length) {
      this.matches.push(tree.get(1))
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