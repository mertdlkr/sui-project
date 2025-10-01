import { ConnectButton } from "@mysten/dapp-kit";
import {
  Badge,
  Box,
  Card,
  Container,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import { useState } from "react";
import { WalletStatus } from "./components/WalletStatus";
import { CreateHero } from "./components/CreateHero";
import { OwnedObjects } from "./components/OwnedObjects";
import SharedObjects from "./components/SharedObjects";
import Arenas from "./components/Arenas";
import EventsHistory from "./components/EventsHistory";

type SectionHeadingProps = {
  title: string;
  description: string;
  accent?: string;
};

function SectionHeading({ title, description, accent }: SectionHeadingProps) {
  return (
    <Flex direction="column" gap="2">
      {accent && (
        <Badge color="blue" size="2" style={{ width: "fit-content" }}>
          {accent}
        </Badge>
      )}
      <Heading size="6">{title}</Heading>
      <Text size="3" color="gray">
        {description}
      </Text>
    </Flex>
  );
}

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const highlightItems = [
    {
      title: "Create",
      description: "Mint custom heroes in seconds and define their power curve.",
    },
    {
      title: "Trade",
      description: "List warriors on-chain and capture value from other players.",
    },
    {
      title: "Battle",
      description: "Spin up arenas and challenge the community for glory.",
    },
  ];

  return (
    <Box
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 0%, rgba(99, 102, 241, 0.26), transparent 55%)," +
          "radial-gradient(circle at 80% 10%, rgba(236, 72, 153, 0.18), transparent 55%)," +
          "linear-gradient(180deg, rgba(5, 7, 18, 0.96), rgba(6, 9, 26, 0.98))",
        color: "var(--gray-12)",
      }}
    >
      <Box
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid var(--gray-a3)",
          backdropFilter: "blur(18px)",
          backgroundColor: "rgba(3, 7, 18, 0.8)",
        }}
      >
        <Container size="4">
          <Flex
            px="4"
            py="3"
            justify="between"
            align="center"
            style={{ gap: "16px" }}
          >
            <Flex direction="column" gap="1">
              <Text size="2" color="gray">
                Sui Move Marketplace
              </Text>
              <Heading size="6">Hero Nexus</Heading>
            </Flex>
            <ConnectButton />
          </Flex>
        </Container>
      </Box>

      <Container size="4" style={{ padding: "48px 0 72px" }}>
        <Flex direction="column" gap="7">
          <Card
            style={{
              padding: "36px",
              borderRadius: "24px",
              border: "1px solid var(--gray-a3)",
              background:
                "linear-gradient(135deg, rgba(59, 130, 246, 0.28), rgba(236, 72, 153, 0.2))",
              backdropFilter: "blur(18px)",
              boxShadow: "0 40px 120px rgba(15, 23, 42, 0.35)",
            }}
          >
            <Flex direction="column" gap="5">
              <Badge color="blue" size="2" style={{ width: "fit-content" }}>
                Powered by Sui
              </Badge>
              <Heading size="8">Forge Legendary Heroes</Heading>
              <Text size="4" color="gray">
                Create, trade, and battle unique warriors with on-chain finality.
              </Text>
              <Flex gap="3" wrap="wrap">
                {highlightItems.map((item) => (
                  <Box
                    key={item.title}
                    style={{
                      minWidth: "180px",
                      padding: "14px 18px",
                      borderRadius: "14px",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      backgroundColor: "rgba(15, 23, 42, 0.45)",
                    }}
                  >
                    <Text size="2" color="gray">
                      {item.title}
                    </Text>
                    <Text size="3" weight="medium">
                      {item.description}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Flex>
          </Card>

          <Flex direction="column" gap="4">
            <SectionHeading
              title="Command Center"
              description="Manage your wallet, mint new heroes, and keep strategic control at a glance."
              accent="Your Hub"
            />
            <Box
              style={{
                display: "grid",
                gap: "24px",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              }}
            >
              <WalletStatus />
              <CreateHero refreshKey={refreshKey} setRefreshKey={setRefreshKey} />
            </Box>
          </Flex>

          <Flex direction="column" gap="4">
            <SectionHeading
              title="Your Collection"
              description="Track, transfer, and prepare your heroes for the marketplace or arena."
              accent="Owned Heroes"
            />
            <OwnedObjects refreshKey={refreshKey} setRefreshKey={setRefreshKey} />
          </Flex>

          <Flex direction="column" gap="4">
            <SectionHeading
              title="Marketplace"
              description="Discover listed heroes, strike deals, and tune pricing with admin controls."
              accent="Live Trades"
            />
            <SharedObjects refreshKey={refreshKey} setRefreshKey={setRefreshKey} />
          </Flex>

          <Flex direction="column" gap="4">
            <SectionHeading
              title="Battle Arenas"
              description="Challenge rival champions and defend your arenas for prestige."
              accent="PvP"
            />
            <Arenas refreshKey={refreshKey} setRefreshKey={setRefreshKey} />
          </Flex>

          <Flex direction="column" gap="4">
            <SectionHeading
              title="Event Timeline"
              description="Follow every listing, sale, and battle conclusion happening on-chain."
              accent="Activity"
            />
            <EventsHistory />
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}

export default App;
