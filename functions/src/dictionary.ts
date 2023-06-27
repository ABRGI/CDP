
export type Tree = {
  v?: string,
  t: Map<number, number>
}


export class TreeDictionary {
  tree: any
  matches: string[] = []

  constructor() {
    this.tree = {}
  }

  addStringInternal(str: string, index: number, tree: any) {
    if (index >= str.length) {
      return
    }
    const ch = str[index]
    if (!tree[ch]) {
      tree[ch] = index === str.length - 1 ? { val: str } : {}
      this.addStringInternal(str, index + 1, tree[ch])
    }
    else
      this.addStringInternal(str, index + 1, tree[ch])
  }

  addString(str: string) {
    this.addStringInternal(str, 0, this.tree)
  }

  findMatches(str: string, maxDistance: number): string[] {
    this.matches = []
    this.findMatchesInternal(str, 0, 0, maxDistance, this.tree)
    return this.matches
  }

  findMatchesInternal(str: string, index: number, currDistance: number, maxDistance: number, tree: any) {
    if (tree.val && index === str.length) {
      this.matches.push(tree.val)
    }

    for (let ch of Object.keys(tree)) {
      if (ch !== 'val') {
        if (index < str.length && ch === str[index]) {
          this.findMatchesInternal(str, index + 1, currDistance, maxDistance, tree[ch])
        }
        else if (currDistance + 1 <= maxDistance) {
          this.findMatchesInternal(str, index + 1, currDistance + 1, maxDistance, tree)
          this.findMatchesInternal(str, index + 1, currDistance + 1, maxDistance, tree[ch])
          this.findMatchesInternal(str, index, currDistance + 1, maxDistance, tree[ch])
        }
      }
    }
  }
}