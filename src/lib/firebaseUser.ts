import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface FirebaseCardMeta {
	tokenId: number | string;
	uri: string;
	rarity: string;
	name: string;
	balance: number;
	onMarket: number;
}

export async function addOwnedCard(
	walletAddress: string,
	newCard: FirebaseCardMeta
) {
	try {
		const userRef = doc(db, "users", walletAddress);
		const userSnap = await getDoc(userRef);

		if (!userSnap.exists()) {
			// 유저 문서가 없으면 새로 생성
			await updateDoc(userRef, {
				ownedCards: [newCard],
			});
			console.log("Firebase: 신규 유저 카드 등록 완료");
			return;
		}

		const data = userSnap.data();
		const ownedCards: FirebaseCardMeta[] = data?.ownedCards || [];

		// 같은 tokenId 카드 찾기
		const idx = ownedCards.findIndex(
			(card) => card.tokenId === newCard.tokenId
		);

		if (idx >= 0) {
			// 기존 카드가 있으면 수량 누적
			ownedCards[idx].balance += newCard.balance;
			// onMarket은 기존 값 유지
		} else {
			// 새 카드면 onMarket 0으로 초기화 후 추가
			ownedCards.push({ ...newCard, onMarket: 0 });
		}

		await updateDoc(userRef, { ownedCards });
		console.log("Firebase: 보유 카드 수량 누적 및 업데이트 완료");
	} catch (error) {
		console.error("Firebase: 보유 카드 업데이트 실패", error);
	}
}
export async function updateUserCardOnMarket(
	walletAddress: string,
	tokenId: string,
	delta: number // 보통 +1, 실패 시 -1
) {
	try {
		const userRef = doc(db, "users", walletAddress);
		const userSnap = await getDoc(userRef);
		if (!userSnap.exists()) return;

		const data = userSnap.data();
		const ownedCards: FirebaseCardMeta[] = data.ownedCards || [];

		const idx = ownedCards.findIndex((c) => c.tokenId === tokenId);
		if (idx < 0) return;

		ownedCards[idx].onMarket += delta;
		if (ownedCards[idx].onMarket < 0) ownedCards[idx].onMarket = 0;

		await updateDoc(userRef, { ownedCards });
		console.log("Firebase: onMarket 수량 변경 완료");
	} catch (error) {
		console.error("Firebase: onMarket 업데이트 실패", error);
	}
}
