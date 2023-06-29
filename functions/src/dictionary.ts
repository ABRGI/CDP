import { distanceMoreThan } from "./utils"

export type Tree = {
  v?: string,
  t: Map<number, number>
}

export class TreeDictionary {
  matches: Set<string> = new Set()
  tree: any[]

  constructor() {
    this.tree = [null]
  }



  addStringInternal(str: string, index: number, tree: any[]) {
    if (index >= str.length) {
      return
    }
    const ch = str.charCodeAt(index)
    if (!this.treeHas(ch, tree)) {
      let val = tree[0] as string
      if (val && index < val.length - 1 && !this.treeGet(val.charCodeAt(index), tree)) {
        tree[0] = null
        const next = [val]
        tree.push(val.charCodeAt(index))
        tree.push(next)
      }
      if (!this.treeHas(ch, tree)) {
        tree.push(ch)
        tree.push([str])
      } else
        this.addStringInternal(str, index + 1, this.treeGet(ch, tree))
    }
    else
      this.addStringInternal(str, index + 1, this.treeGet(ch, tree))
  }

  addString(str: string) {
    this.addStringInternal(str, 0, this.tree)
  }

  findMatches(str: string, maxDistance: number): string[] {
    this.matches.clear()
    this.findMatchesInternal(str, 0, 0, maxDistance, this.tree)
    return Array.from(this.matches.values())
  }

  findMatchesInternal(str: string, index: number, currDistance: number, maxDistance: number, tree: any[]) {
    const val = tree[0]
    if (val && Math.abs(str.length - val.length) <= maxDistance && !distanceMoreThan(str, val, maxDistance)) {
      this.matches.add(val)
    }
    for (let i = 1; i < tree.length; i += 2) {
      const ch = tree[i]
      if (index < str.length && ch === str.charCodeAt(index)) {
        this.findMatchesInternal(str, index + 1, currDistance, maxDistance, tree[i + 1])
      }
      else if (currDistance + 1 <= maxDistance) {
        this.findMatchesInternal(str, index + 1, currDistance + 1, maxDistance, tree)
        this.findMatchesInternal(str, index + 1, currDistance + 1, maxDistance, tree[i + 1])
        this.findMatchesInternal(str, index, currDistance + 1, maxDistance, tree[i + 1])
      }
    }
  }

  treeGet(ch: number, tree: any[]): any | undefined {
    for (let i = 1; i < tree.length; i += 2) {
      if (tree[i] === ch)
        return tree[i + 1]
    }
    return undefined
  }

  treeHas(ch: number, tree: any[]): boolean {
    return tree.length > 1 && this.treeGet(ch, tree) !== undefined
  }
}