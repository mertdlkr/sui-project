import { Transaction } from "@mysten/sui/transactions";

const MIST_PER_SUI = 1_000_000_000n;

export const listHero = (
  packageId: string,
  heroId: string,
  priceInSui: string,
) => {
  const tx = new Transaction();

  const priceInMist = BigInt(priceInSui) * MIST_PER_SUI;

  tx.moveCall({
    target: `${packageId}::marketplace::list_hero`,
    arguments: [tx.object(heroId), tx.pure.u64(priceInMist)],
  });

  return tx;
};
