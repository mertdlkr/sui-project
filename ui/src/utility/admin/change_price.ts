import { Transaction } from "@mysten/sui/transactions";

const MIST_PER_SUI = 1_000_000_000n;

export const changePrice = (
  packageId: string,
  listHeroId: string,
  newPriceInSui: string,
  adminCapId: string,
) => {
  const tx = new Transaction();

  const newPriceInMist = BigInt(newPriceInSui) * MIST_PER_SUI;

  tx.moveCall({
    target: `${packageId}::marketplace::change_the_price`,
    arguments: [
      tx.object(adminCapId),
      tx.object(listHeroId),
      tx.pure.u64(newPriceInMist),
    ],
  });

  return tx;
};
