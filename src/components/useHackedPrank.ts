import { createContext, useContext } from "react";

type HackedPrankContextValue = {
  registerLogoTap: () => void;
};

export const HackedPrankContext = createContext<HackedPrankContextValue | null>(null);

export function useHackedPrank() {
  const context = useContext(HackedPrankContext);
  if (!context) {
    throw new Error("useHackedPrank must be used inside HackedPrankProvider");
  }
  return context;
}
