
export type Tree = {
  value?: string,
  trees: Map<number, number>
}


export class TreeDictionary {
  treeIndex: number
  allTrees: Tree[] = []

  constructor() {
    this.allTrees.push({ trees: new Map() })
    this.treeIndex = this.allTrees.length - 1
  }

  addStringInternal(str: string, index: number, treeIndex: number) {
    if (index >= str.length) {
      return
    }
    const ch = str.charCodeAt(index)
    if (!this.allTrees[treeIndex].trees.has(ch)) {
      this.allTrees.push({ value: index === str.length - 1 ? str : undefined, trees: new Map() })
      this.allTrees[treeIndex].trees.set(ch, this.allTrees.length - 1)
    }
    if (index < str.length) this.addStringInternal(str, index + 1, this.allTrees[treeIndex].trees.get(ch)!)
    return
  }

  addString(str: string) {
    this.addStringInternal(str, 0, this.treeIndex)
  }

  findMatches(str: string, maxDistance: number): string[] {
    return this.findMatchesInternal(str, 0, 0, maxDistance, this.treeIndex)
  }

  findMatchesInternal(str: string, index: number, currDistance: number, maxDistance: number, treeIndex: number): string[] {
    if (currDistance > maxDistance) return []

    let matches: string[] = []
    if (this.allTrees[treeIndex].value && index === str.length) {
      matches.push(this.allTrees[treeIndex].value!)
    }

    for (let [ch, nextTree] of this.allTrees[treeIndex].trees.entries()) {
      if (index < str.length && ch === str.charCodeAt(index)) {
        matches.push(...this.findMatchesInternal(str, index + 1, currDistance, maxDistance, nextTree))
      } else if (currDistance + 1 <= maxDistance) {
        matches.push(...this.findMatchesInternal(str, index + 1, currDistance + 1, maxDistance, treeIndex))
        matches.push(...this.findMatchesInternal(str, index + 1, currDistance + 1, maxDistance, nextTree))
        matches.push(...this.findMatchesInternal(str, index, currDistance + 1, maxDistance, nextTree))
      }
    }
    return matches
  }
}