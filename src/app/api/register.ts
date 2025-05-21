import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { verifyMessage } from "ethers";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== "POST") return res.status(405).end();

	const { walletAddress, signature, agreedAt } = req.body;

	if (!walletAddress || !signature || !agreedAt) {
		return res.status(400).json({ message: "필수 항목 누락" });
	}

	const nonce = "회원가입을 위해 서명해주세요.";

	try {
		const recovered = verifyMessage(nonce, signature);
		if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
			return res.status(401).json({ message: "서명 검증 실패" });
		}

		await setDoc(doc(db, "users", walletAddress), {
			walletAddress,
			agreedAt,
			registeredAt: new Date().toISOString(),
		});

		return res.status(200).json({ message: "회원가입 완료" });
	} catch (err) {
		console.error("서버 오류:", err);
		return res.status(500).json({ message: "서버 오류 발생" });
	}
}
