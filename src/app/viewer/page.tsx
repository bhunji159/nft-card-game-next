"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../../lib/useWallet";
import { ethers } from "ethers";
import GameManagerABI from "../../abis/GameManager.json";
import CardItem from "../components/CardItem";
import styles from "./ViewerPage.module.css";
import { useRouter } from "next/navigation";
import { useContract } from "../../../contracts/ContractContext";

interface CardMeta {
	tokenId: string;
	name: string;
	image: string;
	rarity: string;
	balance?: number;
}

export default function ViewerPage() {
	const { gameManagerAddress } = useContract();
	const { walletAddress } = useWallet();
	const [cards, setCards] = useState<CardMeta[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [search, setSearch] = useState<string>("");
	const [rarityFilter, setRarityFilter] = useState<string>("All");
	const [sortBy, setSortBy] = useState<"name" | "rarity">("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [selectedCard, setSelectedCard] = useState<CardMeta | null>(null);
	const router = useRouter();

	// 뒤로가기 함수
	const handleBack = () => {
		router.back(); // 이전 페이지로 이동
	};
	const rarityOrder: Record<string, number> = {
		Legendary: 1,
		Unique: 2,
		Rare: 3,
		Uncommon: 4,
		Common: 5,
	};

	async function fetchMetadata(
		uri: string
	): Promise<Omit<CardMeta, "tokenId">> {
		try {
			const url = uri.startsWith("ipfs://")
				? uri.replace("ipfs://", "https://ipfs.io/ipfs/")
				: uri;
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error("Failed to load metadata");
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
			console.error("Failed to parse metadata:", error);
			return { name: "Unknown", image: "", rarity: "Unknown" };
		}
	}

	useEffect(() => {
		if (!walletAddress || !window.ethereum) {
			setCards([]);
			return;
		}

		setLoading(true);

		async function loadCards() {
			try {
				const provider = new ethers.providers.Web3Provider(window.ethereum);
				const contract = new ethers.Contract(
					gameManagerAddress,
					GameManagerABI,
					provider
				);

				// Unique 카드 조회
				const [uniqueIds, uniqueUris]: [ethers.BigNumber[], string[]] =
					await contract.getUserUniqueCards(walletAddress);

				// Multi 카드 조회
				const [multiTypeIds, multiBalances, multiUris]: [
					ethers.BigNumber[],
					ethers.BigNumber[],
					string[]
				] = await contract.getUserMultiCards(walletAddress);

				const loadedCards: CardMeta[] = [];

				// Unique 카드 처리
				for (let i = 0; i < uniqueIds.length; i++) {
					const meta = await fetchMetadata(uniqueUris[i]);
					loadedCards.push({
						tokenId: uniqueIds[i].toString(),
						...meta,
						balance: 1, // Unique는 1개씩만 존재
					});
				}

				// Multi 카드 처리
				for (let i = 0; i < multiTypeIds.length; i++) {
					const bal = multiBalances[i].toNumber();
					if (bal > 0) {
						const meta = await fetchMetadata(multiUris[i]);
						loadedCards.push({
							tokenId: multiTypeIds[i].toString(),
							...meta,
							balance: bal,
						});
					}
				}

				setCards(loadedCards);
			} catch (error) {
				console.error("Error loading cards:", error);
				setCards([]);
			} finally {
				setLoading(false);
			}
		}

		loadCards();
	}, [walletAddress]);

	const filteredCards = cards
		.filter((card) => rarityFilter === "All" || card.rarity === rarityFilter)
		.filter((card) => card.name.includes(search))
		.sort((a, b) => {
			const direction = sortOrder === "asc" ? 1 : -1;
			if (sortBy === "name") return a.name.localeCompare(b.name) * direction;

			const aRank = rarityOrder[a.rarity] ?? 999;
			const bRank = rarityOrder[b.rarity] ?? 999;

			return (aRank - bRank) * direction;
		});

	return (
		<div className={styles.container}>
			<button className={styles.backButton} onClick={handleBack}>
				← 뒤로가기
			</button>

			<h2 className={styles.title}>내 카드 목록</h2>

			<div className={styles.filters}>
				<input
					type="text"
					placeholder="카드 이름 검색"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<select
					value={rarityFilter}
					onChange={(e) => setRarityFilter(e.target.value)}
				>
					<option value="All">전체</option>
					<option value="Legendary">Legendary</option>
					<option value="Unique">Unique</option>
					<option value="Rare">Rare</option>
					<option value="Uncommon">Uncommon</option>
					<option value="Common">Common</option>
				</select>
				<select
					value={sortBy}
					onChange={(e) => setSortBy(e.target.value as "name" | "rarity")}
				>
					<option value="name">이름순</option>
					<option value="rarity">희귀도순</option>
				</select>
				<select
					value={sortOrder}
					onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
				>
					<option value="asc">오름차순</option>
					<option value="desc">내림차순</option>
				</select>
			</div>

			<div className={styles.cardList}>
				{loading ? (
					<p>카드 불러오는 중...</p>
				) : filteredCards.length === 0 ? (
					<p>카드가 없습니다.</p>
				) : (
					filteredCards.map((card) => (
						<div key={card.tokenId} onClick={() => setSelectedCard(card)}>
							<CardItem
								name={card.name}
								image={card.image}
								rarity={card.rarity}
								balance={card.balance}
							/>
						</div>
					))
				)}
			</div>

			{selectedCard && (
				<div className={styles.modal} onClick={() => setSelectedCard(null)}>
					<div
						className={styles.modalContent}
						onClick={(e) => e.stopPropagation()}
					>
						<h3>{selectedCard.name}</h3>
						<img src={selectedCard.image} alt={selectedCard.name} />
						<p>희귀도: {selectedCard.rarity}</p>
						{selectedCard.balance !== undefined && (
							<p>수량: {selectedCard.balance}</p>
						)}
						<button onClick={() => setSelectedCard(null)}>닫기</button>
					</div>
				</div>
			)}
		</div>
	);
}
