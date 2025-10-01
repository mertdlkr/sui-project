import { useSuiClientQueries } from "@mysten/dapp-kit";
import { Badge, Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import type { CSSProperties } from "react";
import { useNetworkVariable } from "../networkConfig";

export default function EventsHistory() {
  const packageId = useNetworkVariable("packageId");

  const eventQueries = useSuiClientQueries({
    queries: [
      {
        method: "queryEvents",
        params: {
          query: {
            MoveEventType: `${packageId}::marketplace::HeroListed`,
          },
          limit: 20,
          order: "descending",
        },
        queryKey: ["queryEvents", packageId, "HeroListed"],
        enabled: !!packageId,
      },
      {
        method: "queryEvents",
        params: {
          query: {
            MoveEventType: `${packageId}::marketplace::HeroBought`,
          },
          limit: 20,
          order: "descending",
        },
        queryKey: ["queryEvents", packageId, "HeroBought"],
        enabled: !!packageId,
      },
      {
        method: "queryEvents",
        params: {
          query: {
            MoveEventType: `${packageId}::arena::ArenaCreated`,
          },
          limit: 20,
          order: "descending",
        },
        queryKey: ["queryEvents", packageId, "ArenaCreated"],
        enabled: !!packageId,
      },
      {
        method: "queryEvents",
        params: {
          query: {
            MoveEventType: `${packageId}::arena::ArenaCompleted`,
          },
          limit: 20,
          order: "descending",
        },
        queryKey: ["queryEvents", packageId, "ArenaCompleted"],
        enabled: !!packageId,
      },
    ],
  });

  const [
    { data: listedEvents, isPending: isListedPending },
    { data: boughtEvents, isPending: isBoughtPending },
    { data: battleCreatedEvents, isPending: isBattleCreatedPending },
    { data: battleCompletedEvents, isPending: isBattleCompletedPending },
  ] = eventQueries;

  const formatTimestamp = (timestamp: string) => {
    return new Date(Number(timestamp)).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price: string) => {
    return (Number(price) / 1_000_000_000).toFixed(2);
  };

  const baseCardStyle: CSSProperties = {
    padding: "28px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    backgroundColor: "rgba(9, 13, 27, 0.78)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.35)",
  };

  const eventCardStyle: CSSProperties = {
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(13, 18, 32, 0.7)",
  };

  if (
    isListedPending ||
    isBoughtPending ||
    isBattleCreatedPending ||
    isBattleCompletedPending
  ) {
    return (
      <Card style={baseCardStyle}>
        <Text>Loading events history...</Text>
      </Card>
    );
  }

  const allEvents = [
    ...(listedEvents?.data || []).map((event) => ({
      ...event,
      type: "listed" as const,
    })),
    ...(boughtEvents?.data || []).map((event) => ({
      ...event,
      type: "bought" as const,
    })),
    ...(battleCreatedEvents?.data || []).map((event) => ({
      ...event,
      type: "battle_created" as const,
    })),
    ...(battleCompletedEvents?.data || []).map((event) => ({
      ...event,
      type: "battle_completed" as const,
    })),
  ].sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs));

  return (
    <Flex direction="column" gap="4">
      <Flex align={{ initial: "start", sm: "center" }} justify="between">
        <Flex direction="column" gap="1">
          <Heading size="5">Recent Events</Heading>
          <Text size="2" color="gray">
            Follow every listing, sale, and battle conclusion as it happens.
          </Text>
        </Flex>
        <Badge color="blue" size="2">
          {allEvents.length} events
        </Badge>
      </Flex>

      {allEvents.length === 0 ? (
        <Card style={baseCardStyle}>
          <Text>No events found</Text>
        </Card>
      ) : (
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {allEvents.map((event, index) => {
            const eventData = event.parsedJson as any;

            return (
              <Card
                key={`${event.id.txDigest}-${index}`}
                style={eventCardStyle}
              >
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="3">
                    <Badge
                      color={
                        event.type === "listed"
                          ? "blue"
                          : event.type === "bought"
                            ? "green"
                            : event.type === "battle_created"
                              ? "orange"
                              : "red"
                      }
                      size="2"
                    >
                      {event.type === "listed"
                        ? "Hero Listed"
                        : event.type === "bought"
                          ? "Hero Bought"
                          : event.type === "battle_created"
                            ? "Arena Created"
                            : "Battle Completed"}
                    </Badge>
                    <Text size="2" color="gray">
                      {formatTimestamp(event.timestampMs!)}
                    </Text>
                  </Flex>

                  <Flex align="center" gap="4" wrap="wrap">
                    {(event.type === "listed" || event.type === "bought") && (
                      <>
                        <Text size="2">
                          <strong>Price:</strong> {formatPrice(eventData.price)}{" "}
                          SUI
                        </Text>

                        {event.type === "listed" ? (
                          <Text size="2">
                            <strong>Seller:</strong>{" "}
                            {formatAddress(eventData.seller)}
                          </Text>
                        ) : (
                          <Flex gap="4">
                            <Text size="2">
                              <strong>Buyer:</strong>{" "}
                              {formatAddress(eventData.buyer)}
                            </Text>
                            <Text size="2">
                              <strong>Seller:</strong>{" "}
                              {formatAddress(eventData.seller)}
                            </Text>
                          </Flex>
                        )}

                        <Text
                          size="2"
                          color="gray"
                          style={{ fontFamily: "monospace" }}
                        >
                          ID: {eventData.list_hero_id.slice(0, 8)}...
                        </Text>
                      </>
                    )}

                    {event.type === "battle_created" && (
                      <>
                        <Text size="2">
                          <strong>⚔️ Battle Arena Created</strong>
                        </Text>
                        <Text
                          size="2"
                          color="gray"
                          style={{ fontFamily: "monospace" }}
                        >
                          ID: {eventData.arena_id.slice(0, 8)}...
                        </Text>
                      </>
                    )}

                    {event.type === "battle_completed" && (
                      <>
                        <Text size="2">
                          <strong>🏆 Winner:</strong> ...
                          {eventData.winner_hero_id.slice(-8)}
                        </Text>
                        <Text size="2">
                          <strong>💀 Loser:</strong> ...
                          {eventData.loser_hero_id.slice(-8)}
                        </Text>
                      </>
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
