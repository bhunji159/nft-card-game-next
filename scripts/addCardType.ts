import { ethers } from "hardhat";
import { Event } from "ethers";

async function main() {
	const gameManagerAddress = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0"; // <- 배포된 GameManager 주소 입력
	const gameManager = await ethers.getContractAt("GameManager", gameManagerAddress);

	const [deployer] = await ethers.getSigners();

	console.log("Using deployer:", deployer.address);

	// 1. Unique 카드 등록 (고유 ID와 URI 지정)
	// 1. Unique 카드 등록 (고유 ID와 URI 지정)
	const uniqueCards = [
		{ tokenId: 1, uri: "ipfs://QmZ5AnPhmFeezosBydKCN5ae21AGAQLoqmGhTrhKBvwk3F" },
		{ tokenId: 2, uri: "ipfs://QmUCLwUWkvWkiVTggMSMMrmEuHaj7n8NnBcG7zmtFzAeEY" },
	];

	for (const card of uniqueCards) {
		const tx = await gameManager.connect(deployer).addUniqueCard(card.tokenId, card.uri);
		await tx.wait();
		console.log(`Unique Card Registered: tokenId ${card.tokenId}, URI: ${card.uri}`);
	}

	// 2. Multi 카드 등록 (타입 자동 생성, URI 지정)
	const multiCardURIs = [
		"ipfs://QmZqMKNTjnod4Ai3EghCu5xQjG6XAJbqUMfcwBD2VuHa83",      // typeId = 3
		"ipfs://QmPkqKumiwyiV7tNp5Sof8C6SidLx9iiXhrKtiJk7aWvKx",
		"ipfs://QmdZnrYPRp1MRwfSEz6nyWrh7KNJGVnVSWCbpN1S4ncUv8",
		"ipfs://QmZEw8tQZS2GVdACjFP84YC8hksK9iHdQPT7jT38UqVC3B",
		"ipfs://QmWug8T1vppefetiGG418ghWtVYUFX6xhd3AH4VDo9cxeW",
		"ipfs://QmPQep1y1tyaeLBHJoQ2RxsNy95vPLLSQx2s2VSTgeJVM3",
		"ipfs://Qmev9xEGtwr5PP41G4BCPEHDY55TkVNoQ8jBVAGTkyxuTf",
		"ipfs://QmaMEfM8Cf1dwBUtL9p9vcL8FrcdphLBmYCtxTsjnUJw2D",    // typeId = 10
	];


	for (const uri of multiCardURIs) {
		const tx = await gameManager.connect(deployer).addMultiCardType(uri);
		const receipt = await tx.wait();
		const event = receipt.events?.find((e: Event) => e.event === undefined); // fallback
		console.log(`MultiCard Type Registered: URI = ${uri}`);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Error:", error);
		process.exit(1);
	});