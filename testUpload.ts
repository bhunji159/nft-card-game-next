// testUpload.ts (루트에 생성해서 node로 실행)
import { uploadImage, uploadMetadata } from './src/app/ipfs';

(async () => {
    const imageCid = await uploadImage('./public/image.png');
    console.log('Image CID:', imageCid);

    // 메타데이터 JSON에 image CID를 넣고 업로드
    const metadataCid = await uploadMetadata('./metadata/1.json');
    console.log('Metadata CID:', metadataCid);

    console.log(`tokenURI: ipfs://${metadataCid}`);
})();
