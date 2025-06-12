"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../../lib/useWallet";
import { ethers } from "ethers";
import styles from "./OpenPackPage.module.css";
import CardPackSplit from "./CardPackSplit";
import Modal from "../components/Modal";
import GameManagerABI from "../../abis/GameManager.json";

//------------------------------------------------
const GAME_MANAGER_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
//------------------------------------------------

// 이후 GAME_MANAGER_ADDRESS 변수 사용

const CARD_PACK_PRICE_ETH = "1"; // 1 이더(또는 테스트넷 이더)

export default function OpenPackPage() {
	const { walletAddress } = useWallet();
	const [coinBalance, setCoinBalance] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [txLoading, setTxLoading] = useState(false);
	const [showAnimation, setShowAnimation] = useState(false);
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		if (!walletAddress || !window.ethereum) return;

		async function fetchBalance() {
			setLoading(true);
			try {
				const provider = new ethers.providers.Web3Provider(window.ethereum);
				const balanceWei = await provider.getBalance(walletAddress);
				const balanceEth = ethers.utils.formatEther(balanceWei);
				setCoinBalance(parseFloat(balanceEth).toFixed(4));
			} catch (error) {
				console.error("잔액 조회 실패:", error);
				setCoinBalance(null);
			} finally {
				setLoading(false);
			}
		}

		fetchBalance();
	}, [walletAddress]);

	if (!walletAddress) {
		return <p className={styles.message}>지갑을 연결해 주세요.</p>;
	}

	if (loading) {
		return <p className={styles.message}>데이터를 불러오는 중입니다...</p>;
	}

	async function openCardPack() {
		if (!window.ethereum) throw new Error("메타마스크가 필요합니다.");

		const provider = new ethers.providers.Web3Provider(window.ethereum);
		const signer = provider.getSigner();
		const userAddress = await signer.getAddress();
		// const GAME_MANAGER_ADDRESS = ethers.utils.getAddress(rawAddress); // 자동 체크섬 적용

		const contract = new ethers.Contract(
			GAME_MANAGER_ADDRESS,
			GameManagerABI,
			signer
		);
		const iface = new ethers.utils.Interface(GameManagerABI);
		const priceWei = ethers.utils.parseEther(CARD_PACK_PRICE_ETH);

		// const tx = await contract.openCardPack({ value: priceWei });
		// await tx.wait();

		const tx = await contract.openCardPack({ value: priceWei });
		const receipt = await tx.wait();

		/* 콘솔 디버깅용 */
		for (const log of receipt.logs) {
			if (log.address.toLowerCase() !== GAME_MANAGER_ADDRESS.toLowerCase()) continue;

			try {
				const parsed = iface.parseLog(log);

				if (parsed.name === "UniqueCardMinted") {
					const { user, tokenId, uri } = parsed.args;
					console.log("Unique 카드 발급됨:", { user, tokenId, uri });
				}

				if (parsed.name === "MultiCardMinted") {
					const { user, typeId, uri } = parsed.args;
					console.log("Multi 카드 발급됨:", { user, typeId, uri });
				}
			} catch (err) {
				console.warn("parseLog 실패:", err);
				// ABI에 해당 이벤트가 없으면 무시
			}
		}

		console.log("현재 보유 카드:");
		try {
			const [uniqueIds, uniqueUris] = await contract.getUserUniqueCards(userAddress);
			console.log("Unique Cards:");
			uniqueIds.forEach((id: any, i: any) => {
				console.log(`- ID: ${id.toString()}, URI: ${uniqueUris[i]}`);
			});
		} catch (err) {
			console.warn("Unique 카드 조회 실패:", err);
		}
		try {
			const [multiTypeIds, multiBalances, multiUris] = await contract.getUserMultiCards(userAddress);
			console.log("Multi Cards:");
			multiTypeIds.forEach((id: any, i: any) => {
				if (multiBalances[i].toString() !== "0") {
					console.log(`- ID: ${id.toString()}, 수량: ${multiBalances[i].toString()}, URI: ${multiUris[i]}`);
				}
			});
		} catch (err) {
			console.warn("Multi 카드 조회 실패:", err);
		}
		/* 콘솔 디버깅용 */
	}

	const handleConfirm = async () => {
		setShowModal(false);
		setTxLoading(true);
		try {
			await openCardPack();
			setShowAnimation(true);
		} catch (error: any) {
			alert("카드팩 구매 실패: " + (error?.message || error));
			console.log(error?.message || error);
		} finally {
			setTxLoading(false);
		}
	};

	const handleCancel = () => {
		setShowModal(false);
	};

	return (
		<div className={styles.container}>
			<h2 className={styles.title}>카드팩 개봉 페이지</h2>
			<div className={styles.infoBox}>
				<p>
					카드팩 가격:{" "}
					<span className={styles.highlight}>{CARD_PACK_PRICE_ETH} 코인</span>
				</p>
				<p>
					보유 코인:{" "}
					<span className={styles.highlight}>{coinBalance ?? "조회 실패"}</span>{" "}
					ETH
				</p>
			</div>

			{txLoading && <p className={styles.message}>거래 처리 중...</p>}

			{!showAnimation && !txLoading && (
				<div className={styles.buttonGroup}>
					<button
						className={styles.actionButton}
						onClick={() => setShowModal(true)}
					>
						카드팩 구매하기
					</button>
				</div>
			)}

			{showAnimation && <CardPackSplit />}

			{showModal && (
				<Modal
					message={`카드팩 가격은 ${CARD_PACK_PRICE_ETH} 코인입니다. 구매하시겠습니까?`}
					onCancel={handleCancel}
					onConfirm={handleConfirm}
				/>
			)}
		</div>
	);
}
