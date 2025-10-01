import { Transaction } from "@mysten/sui/transactions";

export const transferAdminCap = (adminCapId: string, to: string) => {
  const tx = new Transaction();

  const adminCap = tx.object(adminCapId);
  tx.transferObjects([adminCap], tx.pure.address(to));

  return tx;
};
