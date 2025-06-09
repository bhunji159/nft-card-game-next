// testUpload.ts (루트에 생성해서 node로 실행)
import { uploadImage, uploadMetadata, ipfsToHttp } from "./src/app/ipfs";

(async () => {
  const imageCid = await uploadImage("./public/성원숭.jpg");
  console.log("Image CID:", imageCid);

  // 메타데이터 JSON에 image CID를 넣고 업로드
  // const metadataCid = await uploadMetadata("./metadata/2.json");
  // console.log("Metadata CID:", metadataCid);

  // console.log(`tokenURI: ipfs://${metadataCid}`);

  const httpUrl = ipfsToHttp(imageCid, "https://ipfs.io/ipfs/");
  console.log("Image URL:", httpUrl);
})();
