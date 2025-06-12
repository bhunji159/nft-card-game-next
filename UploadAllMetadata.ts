import { uploadMetadata } from "./src/app/ipfs";

const uploadAllMetadata = async () => {
  for (let i = 1; i <= 10; i++) {
    const filePath = `./metadata/${i}.json`;
    try {
      const metadataCid = await uploadMetadata(filePath);
      console.log(`[${i}] Metadata CID: ${metadataCid}`);
      console.log(`[${i}] tokenURI: ipfs://${metadataCid}`);
    } catch (error) {
      console.error(`[${i}] ❌ Error uploading ${filePath}:`, error);
    }
  }
};

uploadAllMetadata();