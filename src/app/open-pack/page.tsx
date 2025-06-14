"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../../lib/useWallet";
import { ethers } from "ethers";
import styles from "./OpenPackPage.module.css";
import CardItem from "../components/CardItem";
import Modal from "../components/Modal";
import GameManagerABI from "../../abis/GameManager.json";
import { addOwnedCard, FirebaseCardMeta } from "../../lib/firebaseUser";

const GAME_MANAGER_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const CARD_PACK_PRICE_ETH = "1";

interface CardMeta {
	name: string;
	image: string;
	rarity: string;
}

export default function OpenPackPage({ onBack }: { onBack: () => void }) {
	const { walletAddress } = useWallet();

	const [coinBalance, setCoinBalance] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [txLoading, setTxLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);

	// 애니메이션 상태
	const [showCard, setShowCard] = useState(false);
	const [packCovered, setPackCovered] = useState(false);

	// 마지막 발급 카드 정보
	const [lastMintedCard, setLastMintedCard] = useState<CardMeta | null>(null);

	useEffect(() => {
		if (!walletAddress || !window.ethereum) return;

		async function fetchBalance() {
			setLoading(true);
			try {
				const provider = new ethers.providers.Web3Provider(window.ethereum);
				const balanceWei = await provider.getBalance(walletAddress!);
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

	// 메타데이터에서 name, image, rarity 모두 가져옴
	async function fetchMetadata(uri: string): Promise<CardMeta> {
		try {
			const url = uri.startsWith("ipfs://")
				? uri.replace("ipfs://", "https://ipfs.io/ipfs/")
				: uri;

			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("메타데이터 로드 실패");
			}
			const data = await response.json();

			const rarityAttr = data.attributes?.find(
				(attr: any) => attr.trait_type === "Rarity"
			);

			return {
				name: data.description || "Unknown",
				image: data.image || "",
				rarity: rarityAttr?.value || "Unknown",
			};
		} catch (error) {
			console.error("메타데이터 파싱 실패:", error);
			return { name: "Unknown", image: "", rarity: "Unknown" };
		}
	}

	async function openCardPack() {
		if (!window.ethereum) throw new Error("메타마스크가 필요합니다.");

		const provider = new ethers.providers.Web3Provider(window.ethereum);
		const signer = provider.getSigner();
		const userAddress = await signer.getAddress();

		const contract = new ethers.Contract(
			GAME_MANAGER_ADDRESS,
			GameManagerABI,
			signer
		);
		const iface = new ethers.utils.Interface(GameManagerABI);
		const priceWei = ethers.utils.parseEther(CARD_PACK_PRICE_ETH);

		const tx = await contract.openCardPack({ value: priceWei });
		const receipt = await tx.wait();

		let mintedCardUri: string | null = null;
		let mintedTokenId: number | string | null = null;

		for (const log of receipt.logs) {
			if (log.address.toLowerCase() !== GAME_MANAGER_ADDRESS.toLowerCase())
				continue;

			try {
				const parsed = iface.parseLog(log);

				if (parsed.name === "UniqueCardMinted") {
					const { tokenId, uri } = parsed.args;
					mintedCardUri = uri;
					mintedTokenId = tokenId.toString();
				}

				if (parsed.name === "MultiCardMinted") {
					const { typeId, uri } = parsed.args;
					mintedCardUri = uri;
					mintedTokenId = typeId.toString();
				}
			} catch {
				// 무시
			}
		}

		if (mintedCardUri && mintedTokenId !== null) {
			const cardMeta = await fetchMetadata(mintedCardUri);
			setLastMintedCard(cardMeta);
			setShowCard(true);
			setPackCovered(false);

			if (walletAddress) {
				// Firebase 저장용 객체 생성
				const firebaseCardMeta: FirebaseCardMeta = {
					tokenId: mintedTokenId,
					uri: mintedCardUri,
					rarity: cardMeta.rarity,
					name: cardMeta.name,
				};
				await addOwnedCard(walletAddress, firebaseCardMeta);
			}
		}
	}

	const handleCardAnimationEnd = () => {
		setPackCovered(true);
	};

	const handleConfirm = async () => {
		setShowModal(false);
		setTxLoading(true);
		try {
			await openCardPack();
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

			{!showCard && !txLoading && (
				<div className={styles.buttonGroup}>
					<button
						className={styles.actionButton}
						onClick={() => setShowModal(true)}
					>
						카드팩 구매하기
					</button>
					<button className={styles.backButton} onClick={onBack}>
						뒤로가기
					</button>
				</div>
			)}

			{showModal && (
				<Modal
					message={`카드팩 가격은 ${CARD_PACK_PRICE_ETH} 코인입니다. 구매하시겠습니까?`}
					onCancel={handleCancel}
					onConfirm={handleConfirm}
				/>
			)}

			<div className={styles.myBox}>
				{showCard && lastMintedCard && !packCovered && (
					<CardItem
						name={lastMintedCard.name}
						image={lastMintedCard.image}
						rarity={lastMintedCard.rarity}
						className={styles.cardFlying}
						onAnimationEnd={handleCardAnimationEnd}
					/>
				)}

				{!showCard && packCovered && (
					<img
						src="/images/cardpack.png"
						alt="Card Pack"
						className={styles.packCovered}
					/>
				)}

				{showCard && packCovered && lastMintedCard && (
					<CardItem
						name={lastMintedCard.name}
						image={lastMintedCard.image}
						rarity={lastMintedCard.rarity}
					/>
				)}

				{packCovered && (
					<div className={styles.buttonGroupRight}>
						<button
							className={styles.actionButton}
							onClick={() => {
								setShowCard(false);
								setPackCovered(false);
								setLastMintedCard(null);
								setShowModal(true);
							}}
						>
							개봉하기
						</button>

						<button className={styles.actionButton} onClick={onBack}>
							뒤로가기
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
