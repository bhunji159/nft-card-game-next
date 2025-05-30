// src/ipfs/uploadMetadata.ts
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

export async function uploadMetadata(metadataPath: string): Promise<string> {
    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

    const data = new FormData();
    data.append('file', fs.createReadStream(metadataPath));

    const response = await axios.post(url, data, {
        maxContentLength: Infinity,
        headers: {
            'Content-Type': `multipart/form-data; boundary=${(data as any)._boundary}`,
            pinata_api_key: process.env.PINATA_API_KEY!,
            pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY!,
        },
    });

    console.log('✅ Metadata Uploaded:', response.data);
    return response.data.IpfsHash;
}
