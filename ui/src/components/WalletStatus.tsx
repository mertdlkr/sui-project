import {
  useCurrentAccount,
  useSuiClientQuery,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import {
  Flex,
  Text,
  Card,
  Badge,
  Button,
  TextField,
  Heading,
} from "@radix-ui/themes";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNetworkVariable } from "../networkConfig";
import { transferAdminCap } from "../utility/helpers/transfer_admin_cap";

const cardStyle: CSSProperties = {
  padding: "26px",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.07)",
  backgroundColor: "rgba(8, 11, 24, 0.75)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 24px 80px rgba(15, 23, 42, 0.35)",
};

export function WalletStatus() {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const suiClient = useSuiClient();
  const [transferAdminAddress, setTransferAdminAddress] = useState("");
  const [isTransferringAdmin, setIsTransferringAdmin] = useState(false);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const { data: balance } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
    },
    {
      enabled: !!account,
    }
  );

  // Check if user has AdminCap
  const { data: adminCap } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: {
        StructType: `${packageId}::marketplace::AdminCap`
      },
      options: {
        showContent: true,
        showType: true
      }
    },
    {
      enabled: !!account && !!packageId,
    }
  );

  const isAdmin = (adminCap?.data?.length ?? 0) > 0;
  const adminCapId = adminCap?.data?.[0]?.data?.objectId;

  const handleTransferAdmin = () => {
    if (!transferAdminAddress.trim() || !isAdmin || !adminCapId) return;
    
    setIsTransferringAdmin(true);
    
    const tx = transferAdminCap(adminCapId, transferAdminAddress);
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async ({ digest }) => {
          await suiClient.waitForTransaction({
            digest,
            options: {
              showEffects: true,
              showObjectChanges: true,
            },
          });
          
          setTransferAdminAddress("");
          setIsTransferringAdmin(false);
        },
        onError: () => {
          setIsTransferringAdmin(false);
        }
      }
    );
  };

  const suiBalance = useMemo(() => {
    if (!balance) return null;
    return Number(balance.totalBalance) / 1_000_000_000;
  }, [balance]);

  const formattedBalance = useMemo(() => {
    if (suiBalance === null) return "Loading...";
    return suiBalance.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    });
  }, [suiBalance]);

  const truncatedAddress = account?.address
    ? `${account.address.slice(0, 10)}...${account.address.slice(-6)}`
    : "";

  if (!account) {
    return (
      <Card style={cardStyle}>
        <Flex direction="column" gap="3">
          <Heading size="5">Wallet Overview</Heading>
          <Text>Connect your Sui wallet to unlock hero management tools.</Text>
          <Text size="2" color="gray">
            You will be able to mint heroes, trade on the marketplace, and
            manage arenas once connected.
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Flex direction="column" gap="4">
      <Card style={cardStyle}>
        <Flex direction="column" gap="4">
          <Flex align="center" justify="between">
            <Flex align="center" gap="2">
              <Heading size="5">Wallet Overview</Heading>
              {isAdmin && (
                <Badge color="red" size="2">
                  Admin
                </Badge>
              )}
            </Flex>
            <Badge color="blue" size="1">
              Connected
            </Badge>
          </Flex>

          <Flex
            direction={{ initial: "column", sm: "row" }}
            gap="4"
            align={{ sm: "center" }}
            justify="between"
          >
            <Flex direction="column" gap="1">
              <Text size="2" color="gray">
                Address
              </Text>
              <Text
                size="3"
                weight="medium"
                style={{ fontFamily: "monospace", letterSpacing: "0.03em" }}
              >
                {truncatedAddress}
              </Text>
            </Flex>

            <Flex direction="column" gap="1" style={{ minWidth: "160px" }}>
              <Text size="2" color="gray">
                Balance
              </Text>
              <Text size="6" weight="bold">
                {formattedBalance} SUI
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Card>

      {isAdmin && (
        <Card
          style={{
            ...cardStyle,
            border: "1px solid rgba(248, 113, 113, 0.35)",
            background:
              "linear-gradient(135deg, rgba(248, 113, 113, 0.1), rgba(127, 29, 29, 0.25))",
          }}
        >
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <Heading size="5" color="red">
                Admin Controls
              </Heading>
              <Badge color="red" size="1">
                Sensitive
              </Badge>
            </Flex>
            <Text size="2" color="gray">
              Transfer admin capabilities to another address. This action will
              remove your current privileges.
            </Text>

            <Flex direction={{ initial: "column", sm: "row" }} gap="3">
              <TextField.Root
                placeholder="New admin address"
                value={transferAdminAddress}
                onChange={(e) => setTransferAdminAddress(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                onClick={handleTransferAdmin}
                disabled={!transferAdminAddress.trim() || isTransferringAdmin}
                loading={isTransferringAdmin}
                color="red"
                size="3"
              >
                {isTransferringAdmin
                  ? "Transferring Admin..."
                  : "Transfer Admin Rights"}
              </Button>
            </Flex>
          </Flex>
        </Card>
      )}
    </Flex>
  );
}
