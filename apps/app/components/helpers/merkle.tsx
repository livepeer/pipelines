export function simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(16);
}
  
export interface MerkleNode {
    hash: string;
    children?: Record<string, MerkleNode>;
}
  
export function buildMerkleTree(data: any): MerkleNode {
    if (data === null || data === undefined || typeof data !== "object") {
      return { hash: simpleHash(String(data)) };
    }
  
    const children: Record<string, MerkleNode> = {};
    let combined = "";
  
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        children[String(i)] = buildMerkleTree(data[i]);
        combined += `${i}:${children[String(i)].hash},`;
      }
      return { hash: simpleHash("array:" + combined), children };
    }
  
    const keys = Object.keys(data).sort();
    for (const key of keys) {
      children[key] = buildMerkleTree(data[key]);
      combined += `${key}:${children[key].hash},`;
    }
    return { hash: simpleHash("object:" + combined), children };
}
  
export function diffMerkleTrees(
    oldTree: MerkleNode,
    newTree: MerkleNode,
    path: string[] = []
): string[][] {
    if (oldTree.hash === newTree.hash) {
      return [];
    }
  
    if (!oldTree.children || !newTree.children) {
      return [path];
    }
  
    const diffs: string[][] = [];
    const keys = new Set([...Object.keys(oldTree.children), ...Object.keys(newTree.children)]);
    for (const key of keys) {
      const oldChild = oldTree.children[key];
      const newChild = newTree.children[key];
      if (oldChild && newChild) {
        if (oldChild.hash !== newChild.hash) {
          diffs.push(...diffMerkleTrees(oldChild, newChild, [...path, key]));
        }
      } else {
        diffs.push([...path, key]);
      }
    }
    return diffs;
}