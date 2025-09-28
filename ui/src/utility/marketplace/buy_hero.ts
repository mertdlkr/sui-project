import { Transaction } from "@mysten/sui/transactions";

const MIST_PER_SUI = 1_000_000_000n;

export const buyHero = (packageId: string, listHeroId: string, priceInSui: string) => {
  const tx = new Transaction();

  const priceInMist = BigInt(priceInSui) * MIST_PER_SUI;
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist)]);

  tx.moveCall({
    target: `${packageId}::marketplace::buy_hero`,
    arguments: [tx.object(listHeroId), paymentCoin],
  });

  return tx;
};
