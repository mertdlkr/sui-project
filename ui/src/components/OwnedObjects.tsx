import {
  useCurrentAccount,
  useSuiClientQuery,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Tabs,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useState } from "react";
import type { CSSProperties } from "react";
import { useNetworkVariable } from "../networkConfig";
import { Hero } from "../types/hero";
import { transferHero } from "../utility/helpers/transfer_hero";
import { listHero } from "../utility/marketplace/list_hero";
import { createArena } from "../utility/arena/create_arena";
import { RefreshProps } from "../types/props";

export function OwnedObjects({ refreshKey, setRefreshKey }: RefreshProps) {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const suiClient = useSuiClient();
  const [transferAddress, setTransferAddress] = useState<{
    [key: string]: string;
  }>({});
  const [listPrice, setListPrice] = useState<{ [key: string]: string }>({});
  const [isTransferring, setIsTransferring] = useState<{
    [key: string]: boolean;
  }>({});
  const [isListing, setIsListing] = useState<{ [key: string]: boolean }>({});
  const [isCreatingBattle, setIsCreatingBattle] = useState<{
    [key: string]: boolean;
  }>({});
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {},
  );

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const { data, isPending, error } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: {
        StructType: `${packageId}::hero::Hero`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!account && !!packageId,
      queryKey: ["getOwnedObjects", account?.address, packageId, refreshKey],
    },
  );

  const copyToClipboard = (text: string, heroId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [heroId]: true }));

    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [heroId]: false }));
    }, 2000);
  };

  const handleTransfer = (heroId: string, address: string) => {
    if (!address.trim() || !packageId) return;

    setIsTransferring((prev) => ({ ...prev, [heroId]: true }));

    const tx = transferHero(heroId, address);
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

          setTransferAddress((prev) => ({ ...prev, [heroId]: "" }));
          setRefreshKey(refreshKey + 1);
          setIsTransferring((prev) => ({ ...prev, [heroId]: false }));
        },
        onError: () => {
          setIsTransferring((prev) => ({ ...prev, [heroId]: false }));
        },
      },
    );
  };

  const handleList = (heroId: string, price: string) => {
    if (!price.trim() || !packageId) return;

    setIsListing((prev) => ({ ...prev, [heroId]: true }));

    const tx = listHero(packageId, heroId, price);
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

          setListPrice((prev) => ({ ...prev, [heroId]: "" }));
          setRefreshKey(refreshKey + 1);
          setIsListing((prev) => ({ ...prev, [heroId]: false }));
        },
        onError: () => {
          setIsListing((prev) => ({ ...prev, [heroId]: false }));
        },
      },
    );
  };

  const handleCreateBattle = (heroId: string) => {
    if (!packageId) return;

    setIsCreatingBattle((prev) => ({ ...prev, [heroId]: true }));

    const tx = createArena(packageId, heroId);
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

          setRefreshKey(refreshKey + 1);
          setIsCreatingBattle((prev) => ({ ...prev, [heroId]: false }));
        },
        onError: () => {
          setIsCreatingBattle((prev) => ({ ...prev, [heroId]: false }));
        },
      },
    );
  };

  const baseCardStyle: CSSProperties = {
    padding: "28px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    backgroundColor: "rgba(9, 13, 27, 0.78)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.35)",
  };

  const heroCardStyle: CSSProperties = {
    ...baseCardStyle,
    padding: "0",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.09)",
  };

  if (!account) {
    return (
      <Card style={baseCardStyle}>
        <Text>Please connect your wallet to see your heroes</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={baseCardStyle}>
        <Text color="red">Error: {error.message}</Text>
      </Card>
    );
  }

  if (isPending || !data) {
    return (
      <Card style={baseCardStyle}>
        <Text>Loading your heroes...</Text>
      </Card>
    );
  }

  const heroes = data.data.filter(
    (obj) => obj.data?.content && "fields" in obj.data.content,
  );

  return (
    <Flex direction="column" gap="4">
      <Flex align={{ initial: "start", sm: "center" }} justify="between">
        <Flex direction="column" gap="1">
          <Heading size="5">Your Heroes</Heading>
          <Text size="2" color="gray">
            Manage, transfer, list, or deploy your champions into arenas.
          </Text>
        </Flex>
        <Badge color="blue" size="2">
          {heroes.length} total
        </Badge>
      </Flex>

      {heroes.length === 0 ? (
        <Card style={baseCardStyle}>
          <Text>No heroes found in your wallet</Text>
        </Card>
      ) : (
        <Box
          style={{
            display: "grid",
            gap: "28px",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {heroes.map((obj) => {
            const hero = obj.data?.content as any;
            const heroId = obj.data?.objectId!;
            const fields = hero.fields as Hero;

            return (
              <Card key={heroId} style={heroCardStyle}>
                <Flex direction="column" gap="0">
                  <Box style={{ position: "relative" }}>
                    <img
                      src={fields.image_url}
                      alt={fields.name}
                      style={{
                        width: "100%",
                        height: "220px",
                        objectFit: "cover",
                      }}
                    />
                    <Badge
                      color="blue"
                      size="2"
                      style={{
                        position: "absolute",
                        top: "16px",
                        left: "16px",
                      }}
                    >
                      Power {fields.power}
                    </Badge>
                  </Box>

                  <Flex direction="column" gap="3" style={{ padding: "20px" }}>
                    <Flex direction="column" gap="2">
                      <Heading size="4">{fields.name}</Heading>
                      <Flex align="center" gap="2">
                        <Text
                          size="2"
                          color="gray"
                          style={{ fontFamily: "monospace" }}
                        >
                          {heroId.slice(0, 6)}...{heroId.slice(-6)}
                        </Text>
                        <Button
                          size="1"
                          variant="soft"
                          color={copiedStates[heroId] ? "green" : "gray"}
                          onClick={() => copyToClipboard(heroId, heroId)}
                        >
                          {copiedStates[heroId] ? "Copied" : "Copy"}
                        </Button>
                      </Flex>
                    </Flex>

                    <Tabs.Root defaultValue="transfer">
                      <Tabs.List
                        size="2"
                        style={{
                          backgroundColor: "rgba(15, 23, 42, 0.45)",
                          borderRadius: "12px",
                          padding: "4px",
                        }}
                      >
                        <Tabs.Trigger value="transfer">Transfer</Tabs.Trigger>
                        <Tabs.Trigger value="list">List</Tabs.Trigger>
                        <Tabs.Trigger value="battle">Battle</Tabs.Trigger>
                      </Tabs.List>

                      <Tabs.Content value="transfer">
                        <Flex direction="column" gap="2" mt="3">
                          <TextField.Root
                            placeholder="Recipient address"
                            value={transferAddress[heroId] || ""}
                            onChange={(e) =>
                              setTransferAddress((prev) => ({
                                ...prev,
                                [heroId]: e.target.value,
                              }))
                            }
                            size="3"
                          />
                          <Button
                            onClick={() =>
                              handleTransfer(heroId, transferAddress[heroId])
                            }
                            disabled={
                              !transferAddress[heroId]?.trim() ||
                              isTransferring[heroId]
                            }
                            loading={isTransferring[heroId]}
                            color="blue"
                          >
                            {isTransferring[heroId]
                              ? "Transferring..."
                              : "Transfer Hero"}
                          </Button>
                        </Flex>
                      </Tabs.Content>

                      <Tabs.Content value="list">
                        <Flex direction="column" gap="2" mt="3">
                          <TextField.Root
                            placeholder="Price in SUI"
                            type="number"
                            value={listPrice[heroId] || ""}
                            onChange={(e) =>
                              setListPrice((prev) => ({
                                ...prev,
                                [heroId]: e.target.value,
                              }))
                            }
                            size="3"
                          />
                          <Button
                            onClick={() => handleList(heroId, listPrice[heroId])}
                            disabled={
                              !listPrice[heroId]?.trim() || isListing[heroId]
                            }
                            loading={isListing[heroId]}
                            color="green"
                          >
                            {isListing[heroId] ? "Listing..." : "List for Sale"}
                          </Button>
                        </Flex>
                      </Tabs.Content>

                      <Tabs.Content value="battle">
                        <Flex direction="column" gap="2" mt="3">
                          <Text size="2" color="gray">
                            Create a battle place for other players to
                            challenge your hero.
                          </Text>
                          <Button
                            onClick={() => handleCreateBattle(heroId)}
                            disabled={isCreatingBattle[heroId]}
                            loading={isCreatingBattle[heroId]}
                            color="orange"
                          >
                            {isCreatingBattle[heroId]
                              ? "Creating Arena..."
                              : "Create Arena"}
                          </Button>
                        </Flex>
                      </Tabs.Content>
                    </Tabs.Root>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Box>
      )}
    </Flex>
  );
}
