// src/ipfs/ipfsUtils.ts

export function ipfsToHttp(
  cid: string,
  gateway: string = "https://ipfs.io/ipfs/"
): string {
  return `${gateway}${cid}`;
}
