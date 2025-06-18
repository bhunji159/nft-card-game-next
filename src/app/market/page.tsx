// "use client";

// import { useEffect, useState } from "react";
// import Web3 from "web3";
// import { useWallet } from "../../lib/useWallet";
// import GameManagerABI from "../../abis/GameManager.json";
// import styles from "./MarketPage.module.css";
// import { useContract } from "../../../contracts/ContractContext";
// import { addMarketCardToFirebase } from "../../lib/firebaseMarket";
// import { updateUserCardOnMarket } from "../../lib/firebaseUser";
// import MultiCardItemsABIS from "../../abis/MultiCardItems.json";

// let web3: Web3 | null = null;
// if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
// 	web3 = new Web3(window.ethereum);
// }

// interface OwnedCard {
// 	tokenId: string;
// 	name: string;
// 	rarity: string;
// 	image: string;
// 	balance: number;
// }

// interface MarketCard extends OwnedCard {
// 	price: string;
// }

// export default function MarketPage() {
// 	const { gameManagerAddress } = useContract();
// 	type UniqueCardsReturn = [string[], string[]];
// 	type MultiCardsReturn = [string[], string[], string[]];
// 	const { walletAddress } = useWallet();
// 	const [balance, setBalance] = useState("0");
// 	const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
// 	const [marketCards, setMarketCards] = useState<MarketCard[]>([]);
// 	const [showModal, setShowModal] = useState(false);
// 	const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);
// 	const [inputPrice, setInputPrice] = useState("");
// 	const [search, setSearch] = useState("");
// 	const [sortBy, setSortBy] = useState<"name" | "rarity" | "price">("name");
// 	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
// 	const [loading, setLoading] = useState(false);

// 	async function handleRegisterCard(card: OwnedCard, inputPrice: string) {
// 		if (!walletAddress || !web3 || !inputPrice) return;

// 		try {
// 			setLoading(true);
// 			const contract = new web3.eth.Contract(
// 				GameManagerABI as any,
// 				gameManagerAddress
// 			);

// 			const priceInWei = web3.utils.toWei(inputPrice, "ether");

// 			console.log(card.rarity);
// 			// 1. 스마트컨트랙트 판매 등록
// 			if (card.rarity === "Legendary") {
// 				await contract.methods
// 					.setUniqueCardForSale(String(card.tokenId), priceInWei)
// 					.send({ from: walletAddress });
// 			} else {
// 				const amount = 1;
// 				console.log("등록 시도:", {
// 					tokenId: String(card.tokenId),
// 					priceInWei,
// 					amount,
// 				});

// 				await contract.methods
// 					.setMultiCardForSale(String(card.tokenId), priceInWei, amount)
// 					.send({ from: walletAddress });
// 			}

// 			// 2. Firebase에 등록
// 			await updateUserCardOnMarket(walletAddress, card.tokenId, 1);
// 			await addMarketCardToFirebase({
// 				type: card.rarity === "Legendary" ? "unique" : "multi",
// 				tokenId: card.tokenId,
// 				seller: walletAddress,
// 				price: inputPrice,
// 				amount: 1,
// 				name: card.name,
// 				image: card.image,
// 				rarity: card.rarity,
// 			});

// 			alert("✅ 판매 등록 완료!");
// 		} catch (err: any) {
// 			console.error("등록 실패:", err);

// 			alert(`❌ 등록 실패: ${err.message || "알 수 없는 오류"}`);

// 			// 롤백
// 			await updateUserCardOnMarket(walletAddress, card.tokenId, -1);
// 		} finally {
// 			setLoading(false);
// 			setShowModal(false);
// 		}
// 	}

// 	async function fetchMetadata(
// 		uri: string
// 	): Promise<Omit<OwnedCard, "tokenId" | "balance">> {
// 		try {
// 			const url = uri.startsWith("ipfs://")
// 				? uri.replace("ipfs://", "https://ipfs.io/ipfs/")
// 				: uri;
// 			const response = await fetch(url);
// 			if (!response.ok) throw new Error("메타데이터 로드 실패");
// 			const data = await response.json();
// 			const rarityAttr = data.attributes?.find(
// 				(attr: any) => attr.trait_type === "Rarity"
// 			);

// 			return {
// 				name: data.description || "Unknown",
// 				image: data.image || "/default-card.png",
// 				rarity: rarityAttr?.value || "Unknown",
// 			};
// 		} catch (error) {
// 			console.error("메타데이터 파싱 실패:", error);
// 			return { name: "Unknown", image: "/default-card.png", rarity: "Unknown" };
// 		}
// 	}

// 	useEffect(() => {
// 		if (!walletAddress || !web3) {
// 			setBalance("0");
// 			setOwnedCards([]);
// 			return;
// 		}

// 		async function loadBalanceAndCards() {
// 			try {
// 				const balWei = await web3!.eth.getBalance(walletAddress!);
// 				setBalance(web3!.utils.fromWei(balWei, "ether"));

// 				const contract = new web3!.eth.Contract(
// 					GameManagerABI as any,
// 					gameManagerAddress
// 				);

// 				const uniqueData = (await contract.methods
// 					.getUserUniqueCards(walletAddress)
// 					.call()) as UniqueCardsReturn;

// 				const multiData = (await contract.methods
// 					.getUserMultiCards(walletAddress)
// 					.call()) as MultiCardsReturn;

// 				const cards: OwnedCard[] = [];

// 				for (let i = 0; i < uniqueData[0].length; i++) {
// 					const meta = await fetchMetadata(uniqueData[1][i]);
// 					cards.push({
// 						tokenId: uniqueData[0][i],
// 						balance: 1,
// 						...meta,
// 					});
// 				}

// 				for (let i = 0; i < multiData[0].length; i++) {
// 					const bal = parseInt(multiData[1][i]);
// 					if (bal > 0) {
// 						const meta = await fetchMetadata(multiData[2][i]);
// 						cards.push({
// 							tokenId: multiData[0][i],
// 							balance: bal,
// 							...meta,
// 						});
// 					}
// 				}

// 				setOwnedCards(cards);
// 			} catch (error) {
// 				console.error("카드 조회 실패:", error);
// 				setOwnedCards([]);
// 			}
// 		}

// 		loadBalanceAndCards();
// 	}, [walletAddress, gameManagerAddress]);

// 	const filteredMarketCards = marketCards
// 		.filter((card) => card.name.toLowerCase().includes(search.toLowerCase()))
// 		.sort((a, b) => {
// 			const direction = sortOrder === "asc" ? 1 : -1;
// 			if (sortBy === "name") return a.name.localeCompare(b.name) * direction;
// 			if (sortBy === "rarity")
// 				return a.rarity.localeCompare(b.rarity) * direction;
// 			const priceA = parseFloat(a.price);
// 			const priceB = parseFloat(b.price);
// 			return (priceA - priceB) * direction;
// 		});

// 	return (
// 		<div className={styles["market-container"]}>
// 			<h2 className={styles["section-title"]}>마켓플레이스</h2>

// 			<div className={styles["wallet-balance"]}>💰 잔액: {balance} ETH</div>

// 			<div className={styles["market-sort-controls"]}>
// 				<input
// 					type="text"
// 					placeholder="카드 이름 검색"
// 					value={search}
// 					onChange={(e) => setSearch(e.target.value)}
// 				/>
// 				<select
// 					value={sortBy}
// 					onChange={(e) =>
// 						setSortBy(e.target.value as "name" | "rarity" | "price")
// 					}
// 				>
// 					<option value="name">이름순</option>
// 					<option value="rarity">희귀도순</option>
// 					<option value="price">가격순</option>
// 				</select>
// 				<select
// 					value={sortOrder}
// 					onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
// 				>
// 					<option value="asc">오름차순</option>
// 					<option value="desc">내림차순</option>
// 				</select>
// 			</div>

// 			<div className={styles["card-list"]}>
// 				{filteredMarketCards.map((card, index) => (
// 					<div
// 						key={`${card.tokenId}-${index}`}
// 						className={styles["market-card-wrapper"]}
// 					>
// 						<div className={styles["card-image-wrapper"]}>
// 							<img
// 								src={card.image}
// 								alt={card.name}
// 								className={styles["card-image"]}
// 							/>
// 						</div>
// 						<h3 className={styles["card-title"]}>{card.name}</h3>
// 						<p className={styles["card-rarity"]}>{card.rarity}</p>
// 						<p className={styles["card-price"]}>가격: {card.price}</p>
// 						<button className={styles["buy-button"]}>구매</button>
// 					</div>
// 				))}
// 			</div>

// 			<button
// 				className={styles["register-button"]}
// 				onClick={() => setShowModal(true)}
// 			>
// 				카드 등록
// 			</button>

// 			{showModal && (
// 				<div className={styles["modal"]} onClick={() => setShowModal(false)}>
// 					<div
// 						className={styles["modal-content"]}
// 						onClick={(e) => e.stopPropagation()}
// 					>
// 						<h3>보유한 카드 목록</h3>
// 						<div className={styles["owned-card-list"]}>
// 							{ownedCards.map((card) => (
// 								<div
// 									key={card.tokenId}
// 									className={styles["owned-card-item"]}
// 									onClick={() => setSelectedCard(card)}
// 								>
// 									<div style={{ display: "flex" }}>
// 										<strong>{card.name}</strong>
// 										<div style={{ width: 10 }}></div>
// 										<span
// 											className={`${styles["card-rarity"]} ${
// 												styles[card.rarity.toLowerCase()]
// 											}`}
// 										>
// 											{card.rarity}
// 										</span>
// 									</div>
// 									<span className={styles["card-balance"]}>
// 										수량: {card.balance}
// 									</span>
// 								</div>
// 							))}
// 						</div>
// 						<button onClick={() => setShowModal(false)}>닫기</button>

// 						{selectedCard && (
// 							<div className={styles["register-modal"]}>
// 								<h3>{selectedCard.name} 등록</h3>
// 								<input
// 									type="number"
// 									placeholder="가격 (ETH)"
// 									value={inputPrice}
// 									onChange={(e) => setInputPrice(e.target.value)}
// 								/>
// 								<button
// 									className={styles["register-confirm-button"]}
// 									onClick={() => handleRegisterCard(selectedCard, inputPrice)}
// 									disabled={loading}
// 								>
// 									{loading ? "등록 중..." : "등록하기"}
// 								</button>
// 							</div>
// 						)}
// 					</div>
// 				</div>
// 			)}
// 		</div>
// 	);
// }
"use client";

import { useEffect, useState } from "react";
import Web3 from "web3";
import { useWallet } from "../../lib/useWallet";
import GameManagerABI from "../../abis/GameManager.json";
import styles from "./MarketPage.module.css";
import { useContract } from "../../../contracts/ContractContext";
import { addMarketCardToFirebase } from "../../lib/firebaseMarket";
import { updateUserCardOnMarket } from "../../lib/firebaseUser";
import MultiCardItemsABIS from "../../abis/MultiCardItems.json";

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
			// 멀티카드인 경우 승인 여부 확인
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
			// 스마트컨트랙트에 등록
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

			// Firebase에 등록
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
			});

			alert("✅ 판매 등록 완료!");
		} catch (err: any) {
			console.error("등록 실패:", err);
			alert(`❌ 등록 실패: ${err.message || "알 수 없는 오류"}`);
			await updateUserCardOnMarket(walletAddress, String(card.tokenId), -1);
		} finally {
			setLoading(false);
			setShowModal(false);
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

				const cards: OwnedCard[] = [];

				for (let i = 0; i < uniqueData[0].length; i++) {
					const meta = await fetchMetadata(uniqueData[1][i]);
					cards.push({
						tokenId: uniqueData[0][i],
						balance: 1,
						...meta,
					});
				}

				for (let i = 0; i < multiData[0].length; i++) {
					const bal = parseInt(multiData[1][i]);
					if (bal > 0) {
						const meta = await fetchMetadata(multiData[2][i]);
						cards.push({
							tokenId: multiData[0][i],
							balance: bal,
							...meta,
						});
					}
				}
				console.log("🎴 유저 Unique 카드 목록:", uniqueData[0]); // tokenId 배열
				console.log("🃏 유저 Multi 카드 목록:", multiData[0]); // tokenId 배열

				setOwnedCards(cards);
			} catch (error) {
				console.error("카드 조회 실패:", error);
				setOwnedCards([]);
			}
		}

		loadBalanceAndCards();
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
						<p className={styles["card-price"]}>가격: {card.price}</p>
						<button className={styles["buy-button"]}>구매</button>
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
