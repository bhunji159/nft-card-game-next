import React from "react";
import styles from "./CardItem.module.css";

interface CardItemProps extends React.HTMLAttributes<HTMLDivElement> {
	name: string;
	image: string;
	rarity: string;
	className?: string; // className 선택적 추가
}

const CardItem: React.FC<CardItemProps> = ({
	name,
	image,
	rarity,
	className,
	onAnimationEnd,
	...rest
}) => {
	return (
		<div
			className={`${styles["card-item"]} ${className ?? ""}`}
			onAnimationEnd={onAnimationEnd}
			{...rest}
		>
			<div className={styles["card-image-wrapper"]}>
				<img src={image} alt={name} className={styles["card-image"]} />
			</div>
			<h3 className={styles["card-title"]}>{name}</h3>
			<p className={styles["card-rarity"]}>{rarity}</p>
		</div>
	);
};

export default CardItem;
