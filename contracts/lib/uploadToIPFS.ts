// lib/uploadToIPFS.ts
import { Web3Storage } from 'web3.storage'

export function getWeb3StorageClient() {
  return new Web3Storage({ token: process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN! })
}

export async function uploadFileToIPFS(file: File): Promise<string> {
  const client = getWeb3StorageClient()
  const cid = await client.put([file], {
    name: file.name,
    maxRetries: 3,
  })
  console.log(`✅ Uploaded to IPFS → CID: ${cid}`)
  return `https://${cid}.ipfs.w3s.link/${file.name}`
}
