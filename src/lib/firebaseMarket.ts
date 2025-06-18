import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function addMarketCardToFirebase(card: {
	type: "unique" | "multi";
	tokenId: string;
	seller: string;
	price: string; // ETH 단위
	amount: number;
	name: string;
	image: string;
	rarity: string;
}) {
	try {
		await addDoc(collection(db, "marketCards"), {
			...card,
			createdAt: Timestamp.now(),
		});
		console.log("Firebase: 마켓 카드 등록 완료");
	} catch (error) {
		console.error("Firebase: 마켓 등록 실패", error);
	}
}
