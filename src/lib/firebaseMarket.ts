import {
	collection,
	addDoc,
	Timestamp,
	getDocs,
	doc,
	updateDoc,
	deleteDoc,
} from "firebase/firestore";
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
	pending: number;
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

export async function fetchMarketCardsFromFirebase() {
	const snapshot = await getDocs(collection(db, "marketCards"));
	return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function updateMarketCardPending(
	cardId: string,
	isPending: boolean
) {
	try {
		const cardRef = doc(db, "marketCards", cardId);
		await updateDoc(cardRef, { pending: isPending ? 1 : 0 });
		console.log(`Firebase: pending 상태 업데이트 (${isPending ? 1 : 0})`);
	} catch (error) {
		console.error("Firebase: pending 업데이트 실패", error);
	}
}

export async function deleteMarketCard(cardId: string) {
	try {
		const cardRef = doc(db, "marketCards", cardId);
		await deleteDoc(cardRef);
		console.log("Firebase: 마켓 카드 삭제 완료");
	} catch (error) {
		console.error("Firebase: 마켓 카드 삭제 실패", error);
	}
}
