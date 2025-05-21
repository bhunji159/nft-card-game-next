"use client";
import styles from "./CardItem.module.css";

interface CardItemProps {
	name: string;
	image: string;
	rarity: string;
}

const CardItem: React.FC<CardItemProps> = ({ name, image, rarity }) => {
	return (
		<div className={styles["card-item"]}>
			<div className={styles["card-image-wrapper"]}>
				<img src={image} alt={name} className={styles["card-image"]} />
			</div>
			<h3 className={styles["card-title"]}>{name}</h3>
			<p className={styles["card-rarity"]}>{rarity}</p>
		</div>
	);
};

export default CardItem;
