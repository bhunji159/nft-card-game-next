"use client";
import { getDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { useWallet } from "../../lib/useWallet";
import GameManagerABI from "../../abis/GameManager.json";
import styles from "./MarketPage.module.css";
import { useContract } from "../../../contracts/ContractContext";
import {
	addMarketCardToFirebase,
	updateMarketCardPending,
	deleteMarketCard,
} from "../../lib/firebaseMarket";
import {
	updateUserCardOnMarket,
	addOwnedCard,
	updateUserCardBalance,
} from "../../lib/firebaseUser";
import MultiCardItemsABIS from "../../abis/MultiCardItems.json";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../../lib/firebase";

let web3: Web3 | null = null;
if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
	web3 = new Web3(window.ethereum);
}

interface OwnedCard {
	tokenId: string | number | bigint;
	name: string;
	rarity: string;
	image: string;
	balance: number;
}

interface MarketCard extends OwnedCard {
	price: string;
	seller: string;
	type: "unique" | "multi";
	amount: number;
	pending: number;
}

export default function MarketPage() {
	const { gameManagerAddress, multiCardAddress } = useContract();
	type UniqueCardsReturn = [string[], string[]];
	type MultiCardsReturn = [string[], string[], string[]];
	const { walletAddress } = useWallet();
	const [balance, setBalance] = useState("0");
	const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
	const [marketCards, setMarketCards] = useState<MarketCard[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);
	const [inputPrice, setInputPrice] = useState("");
	const [search, setSearch] = useState("");
	const [sortBy, setSortBy] = useState<"name" | "rarity" | "price">("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [loading, setLoading] = useState(false);

	async function handleRegisterCard(card: OwnedCard, inputPrice: string) {
		if (!walletAddress || !web3 || !inputPrice) return;

		try {
			setLoading(true);
			const contract = new web3.eth.Contract(
				GameManagerABI as any,
				gameManagerAddress
			);

			const priceInWei = web3.utils.toWei(inputPrice, "ether");
			const tokenId = BigInt(card.tokenId);

			if (card.rarity !== "Legendary") {
				const multiNFT = new web3.eth.Contract(
					MultiCardItemsABIS as any,
					multiCardAddress
				);

				const isApproved = await multiNFT.methods
					.isApprovedForAll(walletAddress, gameManagerAddress)
					.call();

				if (!isApproved) {
					await multiNFT.methods
						.setApprovalForAll(gameManagerAddress, true)
						.send({ from: walletAddress });
					console.log("✅ GameManager에 대한 승인 완료");
				}

				const balance = await multiNFT.methods
					.balanceOf(walletAddress, tokenId)
					.call();
				console.log(`💡 등록 전 잔액 확인: ${balance}`);
			}

			console.log(tokenId);
			if (card.rarity === "Legendary") {
				await contract.methods
					.setUniqueCardForSale(tokenId, priceInWei)
					.send({ from: walletAddress });
			} else {
				const amount = 1;
				await contract.methods
					.setMultiCardForSale(tokenId, priceInWei, amount)
					.send({ from: walletAddress });
			}

			await updateUserCardOnMarket(walletAddress, String(card.tokenId), 1);
			await addMarketCardToFirebase({
				type: card.rarity === "Legendary" ? "unique" : "multi",
				tokenId: String(card.tokenId),
				seller: walletAddress,
				price: inputPrice,
				amount: 1,
				name: card.name,
				image: card.image,
				rarity: card.rarity,
				pending: 0,
			});

			alert("✅ 판매 등록 완료!");
			await loadMarketCards(); // 등록 후 목록 다시 로드
		} catch (err: any) {
			console.error("등록 실패:", err);
			alert(`❌ 등록 실패: ${err.message || "알 수 없는 오류"}`);
			await updateUserCardOnMarket(walletAddress, String(card.tokenId), -1);
		} finally {
			setLoading(false);
			setShowModal(false);
		}
	}
	async function handleBuy(card: MarketCard & { id?: string }) {
		if (!walletAddress || !web3) return;
		if (card.pending === 1) {
			alert("이미 거래 중인 카드입니다.");
			return;
		}

		try {
			setLoading(true);

			// 1. 해당 카드 문서의 ID를 가져오기 위해 전체 다시 불러옴
			const q = query(collection(db, "marketCards"));
			const snapshot = await getDocs(q);
			const docData = snapshot.docs.find(
				(doc) =>
					doc.data().tokenId === card.tokenId &&
					doc.data().seller === card.seller &&
					doc.data().price === card.price
			);
			if (!docData) throw new Error("해당 카드 문서를 찾을 수 없습니다.");

			const docId = docData.id;

			// 2. Firebase pending 설정
			await updateMarketCardPending(docId, true);

			// 3. 스마트컨트랙트 구매 트랜잭션
			const contract = new web3.eth.Contract(
				GameManagerABI as any,
				gameManagerAddress
			);
			const value = web3.utils.toWei(card.price, "ether");
			const tokenId = BigInt(card.tokenId);

			if (card.type === "unique") {
				await contract.methods
					.buyUniqueCard(tokenId, card.seller)
					.send({ from: walletAddress, value });
			} else {
				await contract.methods
					.buyMultiCard(card.seller, tokenId, 1)
					.send({ from: walletAddress, value });
			}

			// 4. Firebase 처리
			await deleteMarketCard(docId); // 마켓에서 삭제
			await addOwnedCard(walletAddress, {
				tokenId: String(tokenId),
				uri: card.image,
				rarity: card.rarity,
				name: card.name,
				balance: 1,
				onMarket: 0,
			});
			await updateUserCardBalance(card.seller, String(tokenId), -1);
			await updateUserCardOnMarket(card.seller, String(tokenId), -1);

			alert("✅ 구매 완료!");
			await loadMarketCards();
		} catch (err: any) {
			console.log("🧾 walletAddress:", walletAddress);

			console.error("❌ 구매 실패:", err);
			alert("❌ 구매 중 오류가 발생했습니다.");

			// 실패 시 pending 복구
			try {
				const q = query(collection(db, "marketCards"));
				const snapshot = await getDocs(q);
				const docData = snapshot.docs.find(
					(doc) =>
						doc.data().tokenId === card.tokenId &&
						doc.data().seller === card.seller &&
						doc.data().price === card.price
				);
				if (docData) {
					await updateMarketCardPending(docData.id, false);
				}
			} catch (err2) {
				console.warn("pending 복구 실패:", err2);
			}
		} finally {
			setLoading(false);
		}
	}

	async function fetchMetadata(
		uri: string
	): Promise<Omit<OwnedCard, "tokenId" | "balance">> {
		try {
			const url = uri.startsWith("ipfs://")
				? uri.replace("ipfs://", "https://ipfs.io/ipfs/")
				: uri;
			const response = await fetch(url);
			if (!response.ok) throw new Error("메타데이터 로드 실패");
			const data = await response.json();
			const rarityAttr = data.attributes?.find(
				(attr: any) => attr.trait_type === "Rarity"
			);
			return {
				name: data.description || "Unknown",
				image: data.image || "/default-card.png",
				rarity: rarityAttr?.value || "Unknown",
			};
		} catch (error) {
			console.error("메타데이터 파싱 실패:", error);
			return { name: "Unknown", image: "/default-card.png", rarity: "Unknown" };
		}
	}

	async function loadMarketCards() {
		try {
			const q = query(collection(db, "marketCards"));
			const snapshot = await getDocs(q);
			const cards: MarketCard[] = snapshot.docs.map(
				(doc) => doc.data() as MarketCard
			);
			setMarketCards(cards);
		} catch (err) {
			console.error("❌ 마켓 카드 로드 실패", err);
		}
	}

	useEffect(() => {
		if (!walletAddress || !web3) {
			setBalance("0");
			setOwnedCards([]);
			return;
		}

		async function loadBalanceAndCards() {
			try {
				const balWei = await web3!.eth.getBalance(walletAddress!);
				setBalance(web3!.utils.fromWei(balWei, "ether"));

				const contract = new web3!.eth.Contract(
					GameManagerABI as any,
					gameManagerAddress
				);

				const uniqueData = (await contract.methods
					.getUserUniqueCards(walletAddress)
					.call()) as UniqueCardsReturn;

				const multiData = (await contract.methods
					.getUserMultiCards(walletAddress)
					.call()) as MultiCardsReturn;

				// Firebase에서 유저 카드 정보 가져오기
				const userDocRef = doc(db, "users", walletAddress!);
				const userSnap = await getDoc(userDocRef);
				const firebaseCards = userSnap.exists()
					? userSnap.data().ownedCards
					: [];

				const cards: OwnedCard[] = [];

				// Unique 카드 처리
				for (let i = 0; i < uniqueData[0].length; i++) {
					const tokenId = uniqueData[0][i];
					const meta = await fetchMetadata(uniqueData[1][i]);
					const fbCard = firebaseCards.find((c: any) => c.tokenId === tokenId);

					// onMarket이 0이면 등록 가능
					if (!fbCard || fbCard.onMarket < 1) {
						cards.push({
							tokenId,
							balance: 1,
							...meta,
						});
					}
				}

				// Multi 카드 처리
				for (let i = 0; i < multiData[0].length; i++) {
					const tokenId = multiData[0][i];
					const balance = parseInt(multiData[1][i]);
					const meta = await fetchMetadata(multiData[2][i]);
					const fbCard = firebaseCards.find(
						(c: any) => String(c.tokenId) === String(tokenId)
					);
					const onMarket = fbCard?.onMarket || 0;
					const sellBalance = balance - parseInt(onMarket);

					if (balance > onMarket) {
						cards.push({
							tokenId,
							balance: sellBalance,
							...meta,
						});
					}
				}

				setOwnedCards(cards);
			} catch (error) {
				console.error("카드 조회 실패:", error);
				setOwnedCards([]);
			}
		}

		loadBalanceAndCards();
		loadMarketCards();
	}, [walletAddress, gameManagerAddress]);

	const filteredMarketCards = marketCards
		.filter((card) => card.name.toLowerCase().includes(search.toLowerCase()))
		.sort((a, b) => {
			const direction = sortOrder === "asc" ? 1 : -1;
			if (sortBy === "name") return a.name.localeCompare(b.name) * direction;
			if (sortBy === "rarity")
				return a.rarity.localeCompare(b.rarity) * direction;
			const priceA = parseFloat(a.price);
			const priceB = parseFloat(b.price);
			return (priceA - priceB) * direction;
		});

	return (
		<div className={styles["market-container"]}>
			<h2 className={styles["section-title"]}>마켓플레이스</h2>
			<div className={styles["wallet-balance"]}>💰 잔액: {balance} ETH</div>

			<div className={styles["market-sort-controls"]}>
				<input
					type="text"
					placeholder="카드 이름 검색"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<select
					value={sortBy}
					onChange={(e) =>
						setSortBy(e.target.value as "name" | "rarity" | "price")
					}
				>
					<option value="name">이름순</option>
					<option value="rarity">희귀도순</option>
					<option value="price">가격순</option>
				</select>
				<select
					value={sortOrder}
					onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
				>
					<option value="asc">오름차순</option>
					<option value="desc">내림차순</option>
				</select>
			</div>

			<div className={styles["card-list"]}>
				{filteredMarketCards.map((card, index) => (
					<div
						key={`${card.tokenId}-${index}`}
						className={styles["market-card-wrapper"]}
					>
						<div className={styles["card-image-wrapper"]}>
							<img
								src={card.image}
								alt={card.name}
								className={styles["card-image"]}
							/>
						</div>
						<h3 className={styles["card-title"]}>{card.name}</h3>
						<p className={styles["card-rarity"]}>{card.rarity}</p>
						<p className={styles["card-price"]}>가격: {card.price} ETH</p>
						<button
							className={styles["buy-button"]}
							disabled={loading || card.pending === 1}
							onClick={() => handleBuy(card)}
						>
							{card.pending === 1 ? "거래 중..." : "구매"}
						</button>
					</div>
				))}
			</div>

			<button
				className={styles["register-button"]}
				onClick={() => setShowModal(true)}
			>
				카드 등록
			</button>

			{showModal && (
				<div className={styles["modal"]} onClick={() => setShowModal(false)}>
					<div
						className={styles["modal-content"]}
						onClick={(e) => e.stopPropagation()}
					>
						<h3>보유한 카드 목록</h3>
						<div className={styles["owned-card-list"]}>
							{ownedCards.map((card) => (
								<div
									key={card.tokenId}
									className={styles["owned-card-item"]}
									onClick={() => setSelectedCard(card)}
								>
									<div style={{ display: "flex" }}>
										<strong>{card.name}</strong>
										<div style={{ width: 10 }}></div>
										<span
											className={`${styles["card-rarity"]} ${
												styles[card.rarity.toLowerCase()]
											}`}
										>
											{card.rarity}
										</span>
									</div>
									<span className={styles["card-balance"]}>
										수량: {card.balance}
									</span>
								</div>
							))}
						</div>
						<button onClick={() => setShowModal(false)}>닫기</button>

						{selectedCard && (
							<div className={styles["register-modal"]}>
								<h3>{selectedCard.name} 등록</h3>
								<input
									type="number"
									placeholder="가격 (ETH)"
									value={inputPrice}
									onChange={(e) => setInputPrice(e.target.value)}
								/>
								<button
									className={styles["register-confirm-button"]}
									onClick={() => handleRegisterCard(selectedCard, inputPrice)}
									disabled={loading}
								>
									{loading ? "등록 중..." : "등록하기"}
								</button>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
