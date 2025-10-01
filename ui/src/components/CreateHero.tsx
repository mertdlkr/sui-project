import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import {
  Flex,
  Heading,
  Text,
  Card,
  Button,
  TextField,
  Badge,
} from "@radix-ui/themes";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNetworkVariable } from "../networkConfig";
import { RefreshProps } from "../types/props";
import { createHero } from "../utility/heroes/create_hero";

const containerStyle: CSSProperties = {
  padding: "28px",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.07)",
  backgroundColor: "rgba(11, 15, 30, 0.78)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 24px 80px rgba(15, 23, 42, 0.35)",
};

const previewStyle: CSSProperties = {
  border: "1px dashed rgba(255, 255, 255, 0.12)",
  borderRadius: "16px",
  padding: "20px",
  minHeight: "100%",
  background:
    "linear-gradient(135deg, rgba(147, 197, 253, 0.08), rgba(59, 130, 246, 0.05))",
};

export function CreateHero({ refreshKey, setRefreshKey }: RefreshProps) {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [power, setPower] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateHero = async () => {
    if (!account || !packageId || !name.trim() || !imageUrl.trim() || !power.trim()) return;
    
    setIsCreating(true);
    
    const tx = createHero(packageId, name, imageUrl, power);
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
          
          setName("");
          setImageUrl("");
          setPower("");
          setRefreshKey(refreshKey + 1);
          setIsCreating(false);
        },
        onError: () => {
          setIsCreating(false);
        }
      }
    );
  };

  const isFormValid = name.trim() && imageUrl.trim() && power.trim() && Number(power) > 0;

  const previewActive = useMemo(
    () => Boolean(name || imageUrl || power),
    [imageUrl, name, power],
  );

  if (!account) {
    return (
      <Card style={containerStyle}>
        <Flex direction="column" gap="3">
          <Heading size="5">Create New Hero</Heading>
          <Text>
            Connect your wallet to start minting custom warriors for your
            collection.
          </Text>
          <Text size="2" color="gray">
            Set a name, artwork, and power rating to bring a new champion to life
            on Sui.
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Card style={containerStyle}>
      <Flex direction="column" gap="5">
        <Flex align="center" justify="between">
          <Flex direction="column" gap="1">
            <Heading size="5">Create New Hero</Heading>
            <Text size="2" color="gray">
              Define a hero&apos;s identity and mint it directly on-chain.
            </Text>
          </Flex>
          <Badge color="green" size="1">
            Ready to Mint
          </Badge>
        </Flex>

        <Flex
          direction={{ initial: "column", sm: "row" }}
          gap="4"
          align="stretch"
        >
          <Flex direction="column" gap="3" style={{ flex: 1 }}>
            <Flex direction="column" gap="2">
              <Text size="2" color="gray">
                Hero Name
              </Text>
              <TextField.Root
                placeholder="Enter hero name (e.g., Fire Dragon)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                size="3"
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="2" color="gray">
                Image URL
              </Text>
              <TextField.Root
                placeholder="Enter image URL (e.g., https://example.com/hero.jpg)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                size="3"
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="2" color="gray">
                Power Level
              </Text>
              <TextField.Root
                placeholder="Enter power level (e.g., 120)"
                type="number"
                min="1"
                value={power}
                onChange={(e) => setPower(e.target.value)}
                size="3"
              />
            </Flex>

            <Button
              onClick={handleCreateHero}
              disabled={!isFormValid || isCreating}
              size="3"
              loading={isCreating}
            >
              {isCreating ? "Creating Hero..." : "Create Hero"}
            </Button>
          </Flex>

          <Flex direction="column" style={{ flex: 1 }}>
            <div style={previewStyle}>
              <Flex direction="column" gap="3">
                <Text size="2" color="gray">
                  Live Preview
                </Text>
                {previewActive ? (
                  <Flex direction="column" gap="3">
                    <Heading size="4">{name || "Unnamed Hero"}</Heading>
                    <Badge color="blue" size="2">
                      Power: {power || "?"}
                    </Badge>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        style={{
                          width: "100%",
                          height: "220px",
                          objectFit: "cover",
                          borderRadius: "14px",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <Flex
                        align="center"
                        justify="center"
                        style={{
                          width: "100%",
                          height: "220px",
                          borderRadius: "14px",
                          backgroundColor: "rgba(15, 23, 42, 0.6)",
                          border: "1px dashed rgba(255, 255, 255, 0.12)",
                        }}
                      >
                        <Text size="2" color="gray">
                          Artwork preview appears here
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                ) : (
                  <Flex
                    direction="column"
                    gap="2"
                    align="center"
                    justify="center"
                    style={{ minHeight: "220px" }}
                  >
                    <Text size="3" weight="medium">
                      Your hero preview will appear here
                    </Text>
                    <Text size="2" color="gray">
                      Fill out the form to see your champion come to life.
                    </Text>
                  </Flex>
                )}
              </Flex>
            </div>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}
