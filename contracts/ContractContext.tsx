// ContractContext.tsx
import React, { createContext, useContext } from "react";

const GAME_MANAGER_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const Multi_CARD_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const ContractContext = createContext({
	gameManagerAddress: GAME_MANAGER_ADDRESS,
	multiCardAddress: Multi_CARD_ADDRESS,
});

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	return (
		<ContractContext.Provider
			value={{
				gameManagerAddress: GAME_MANAGER_ADDRESS,
				multiCardAddress: Multi_CARD_ADDRESS,
			}}
		>
			{children}
		</ContractContext.Provider>
	);
};

export const useContract = () => useContext(ContractContext);
