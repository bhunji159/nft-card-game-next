import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";

export interface FirebaseCardMeta {
	tokenId: number | string;
	uri: string;
	rarity: string;
	name: string;
}

/**
 * 유저 Firestore 문서에 보유 카드 추가
 * @param walletAddress 유저 지갑 주소
 * @param card 카드 메타데이터 객체
 */
export async function addOwnedCard(
	walletAddress: string,
	card: FirebaseCardMeta
) {
	try {
		const userRef = doc(db, "users", walletAddress);
		await updateDoc(userRef, {
			ownedCards: arrayUnion(card),
		});
		console.log("Firebase: 보유 카드 업데이트 성공");
	} catch (error) {
		console.error("Firebase: 보유 카드 업데이트 실패", error);
	}
}
