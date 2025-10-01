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
  Text,
} from "@radix-ui/themes";
import { useState } from "react";
import type { CSSProperties } from "react";
import { useNetworkVariable } from "../networkConfig";
import { Hero, Arena } from "../types/hero";
import { battle } from "../utility/arena/battle";
import { RefreshProps } from "../types/props";

export default function Arenas({ refreshKey, setRefreshKey }: RefreshProps) {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const suiClient = useSuiClient();
  const [isBattling, setIsBattling] = useState<{ [key: string]: boolean }>({});
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // Get user's heroes for battle
  const { data: userHeroes } = useSuiClientQuery(
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
      queryKey: [
        "getOwnedObjects",
        "Heroes",
        account?.address,
        packageId,
        refreshKey,
      ],
    },
  );

  // Get Arena created events to find active battle places
  const { data: battleEvents, isPending: eventsLoading } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: `${packageId}::arena::ArenaCreated`,
      },
      limit: 50,
      order: "descending",
    },
    {
      enabled: !!packageId,
      queryKey: ["queryEvents", packageId, "ArenaCreated", refreshKey],
    },
  );

  const { data, isPending, error } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids:
        battleEvents?.data?.map((event) => (event.parsedJson as any).arena_id) || [],
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!packageId && battleEvents?.data !== undefined,
      queryKey: [
        "multiGetObjects",
        "Arenas",
        battleEvents?.data?.map((event) => (event.parsedJson as any).arena_id),
        refreshKey,
      ],
    },
  );

  const handleBattle = (arenaId: string, heroId: string) => {
    if (!account || !packageId) return;

    setIsBattling((prev) => ({ ...prev, [`${arenaId}_${heroId}`]: true }));

    const tx = battle(packageId, heroId, arenaId);
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
          setIsBattling((prev) => ({
            ...prev,
            [`${arenaId}_${heroId}`]: false,
          }));
        },
        onError: () => {
          setIsBattling((prev) => ({
            ...prev,
            [`${arenaId}_${heroId}`]: false,
          }));
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

  const arenaCardStyle: CSSProperties = {
    ...baseCardStyle,
    padding: "0",
    border: "1px solid rgba(255, 255, 255, 0.09)",
    overflow: "hidden",
  };

  if (error) {
    return (
      <Card style={baseCardStyle}>
        <Text color="red">Error loading arenas: {error.message}</Text>
      </Card>
    );
  }

  if (eventsLoading || isPending || !data) {
    return (
      <Card style={baseCardStyle}>
        <Text>Loading arenas...</Text>
      </Card>
    );
  }

  if (!battleEvents?.data?.length) {
    return (
      <Flex direction="column" gap="4">
        <Flex align={{ initial: "start", sm: "center" }} justify="between">
          <Heading size="5">Battle Arena</Heading>
          <Badge color="orange" size="2">
            0 arenas
          </Badge>
        </Flex>
        <Card style={baseCardStyle}>
          <Text>No arenas are currently available</Text>
        </Card>
      </Flex>
    );
  }

  const activeArenas =
    data?.filter((obj) => obj.data?.content && "fields" in obj.data.content) ||
    [];
  const availableHeroes =
    userHeroes?.data?.filter(
      (obj) => obj.data?.content && "fields" in obj.data.content,
    ) || [];

  return (
    <Flex direction="column" gap="4">
      <Flex align={{ initial: "start", sm: "center" }} justify="between">
        <Flex direction="column" gap="1">
          <Heading size="5">Battle Arena</Heading>
          <Text size="2" color="gray">
            Challenge rival champions or defend your arenas for prestige.
          </Text>
        </Flex>
        <Badge color="orange" size="2">
          {activeArenas.length} active
        </Badge>
      </Flex>

      {!account && (
        <Card style={baseCardStyle}>
          <Text>Please connect your wallet to participate in battles</Text>
        </Card>
      )}

      {account && availableHeroes.length === 0 && (
        <Card style={baseCardStyle}>
          <Text color="orange">
            You need heroes to participate in battles. Create some heroes first!
          </Text>
        </Card>
      )}

      {activeArenas.length === 0 ? (
        <Card style={baseCardStyle}>
          <Text>No active arenas found</Text>
        </Card>
      ) : (
        <Box
          style={{
            display: "grid",
            gap: "28px",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {activeArenas.map((obj) => {
            const arena = obj.data?.content as any;
            const arenaId = obj.data?.objectId!;
            const fields = arena.fields as Arena;
            const warriorFields = fields.warrior.fields as Hero;

            return (
              <Card key={arenaId} style={arenaCardStyle}>
                <Flex direction="column" gap="0">
                  <Box style={{ position: "relative" }}>
                    <img
                      src={warriorFields.image_url}
                      alt={warriorFields.name}
                      style={{
                        width: "100%",
                        height: "220px",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <Badge
                      color="orange"
                      size="2"
                      style={{ position: "absolute", top: "16px", left: "16px" }}
                    >
                      ⚔️ Battle Ready
                    </Badge>
                  </Box>

                  <Flex direction="column" gap="3" style={{ padding: "20px" }}>
                    <Flex direction="column" gap="2">
                      <Heading size="4">{warriorFields.name}</Heading>
                      <Flex align="center" justify="between">
                        <Badge color="blue" size="2">
                          Power {warriorFields.power}
                        </Badge>
                        <Text size="2" color="gray">
                          Owner {fields.owner.slice(0, 6)}...{fields.owner.slice(-4)}
                        </Text>
                      </Flex>
                    </Flex>

                    {account && availableHeroes.length > 0 && (
                      <Flex direction="column" gap="2">
                        <Text size="2" color="gray">
                          Challenge with your hero:
                        </Text>
                        {availableHeroes.slice(0, 3).map((heroObj) => {
                          const heroContent = heroObj.data?.content as any;
                          const heroId = heroObj.data?.objectId!;
                          const heroFields = heroContent.fields as Hero;
                          const battleKey = `${arenaId}_${heroId}`;
                          const isMyArena = fields.owner === account.address;

                          return (
                            <Flex
                              key={heroId}
                              align="center"
                              gap="2"
                              style={{
                                padding: "10px 12px",
                                borderRadius: "12px",
                                backgroundColor: "rgba(15, 23, 42, 0.45)",
                              }}
                            >
                              <Text size="2" style={{ flex: 1 }}>
                                {heroFields.name} (Power {heroFields.power})
                              </Text>
                              <Button
                                onClick={() => handleBattle(arenaId, heroId)}
                                disabled={isBattling[battleKey]}
                                loading={isBattling[battleKey]}
                                color={isMyArena ? "gray" : "orange"}
                                size="2"
                              >
                                {isBattling[battleKey] ? "Battling..." : "Battle"}
                              </Button>
                            </Flex>
                          );
                        })}
                      </Flex>
                    )}
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
