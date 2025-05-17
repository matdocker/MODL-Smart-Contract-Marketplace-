'use client';  // ✅ ensures this runs only on the client side

import { create } from 'ipfs-http-client';

let client: ReturnType<typeof create> | null = null;

// Lazy-initialize the client only once
function getClient() {
  if (!client) {
    client = create({ url: 'https://ipfs.infura.io:5001/api/v0' });
  }
  return client;
}

export async function uploadToIPFS(file: File) {
  try {
    const { create } = await import('ipfs-http-client'); // ← dynamic import ONLY on client
    const client = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

    const added = await client.add(file);
    console.log(`✅ File uploaded to IPFS → CID: ${added.cid}`);
    return added.cid.toString();
  } catch (err) {
    console.error(`❌ IPFS upload failed:`, err);
    throw err;
  }
}

