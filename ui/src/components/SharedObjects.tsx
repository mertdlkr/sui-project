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
import { ListHero } from "../types/hero";
import { buyHero } from "../utility/marketplace/buy_hero";
import { delist } from "../utility/admin/delist";
import { changePrice } from "../utility/admin/change_price";
import { RefreshProps } from "../types/props";

export default function SharedObjects({ refreshKey, setRefreshKey }: RefreshProps) {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const suiClient = useSuiClient();
  const [isBuying, setIsBuying] = useState<{ [key: string]: boolean }>({});
  const [isDelisting, setIsDelisting] = useState<{ [key: string]: boolean }>({});
  const [isChangingPrice, setIsChangingPrice] = useState<{ [key: string]: boolean }>({});
  const [newPrice, setNewPrice] = useState<{ [key: string]: string }>({});
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

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
      queryKey: ["getOwnedObjects", "AdminCap", account?.address, packageId, refreshKey],
    }
  );

  const isAdmin = (adminCap?.data?.length ?? 0) > 0;
  const adminCapId = adminCap?.data?.[0]?.data?.objectId;

  const { data: listedEvents, isPending: eventsLoading } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: `${packageId}::marketplace::HeroListed`
      },
      limit: 50,
      order: "descending"
    },
    {
      enabled: !!packageId,
      queryKey: ["queryEvents", packageId, "HeroListed", refreshKey],
    }
  );

  const { data, isPending, error } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: listedEvents?.data?.map(event => (event.parsedJson as any).list_hero_id) || [],
      options: {
        showContent: true,
        showType: true
      }
    },
    {
      enabled: !!packageId && listedEvents?.data !== undefined,
      queryKey: ["multiGetObjects", listedEvents?.data?.map(event => (event.parsedJson as any).list_hero_id), refreshKey],
    }
  );

  const handleBuy = (listHeroId: string, price: string) => {
    if (!account || !packageId) return;
    
    setIsBuying(prev => ({ ...prev, [listHeroId]: true }));
    
    const tx = buyHero(packageId, listHeroId, price);
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
          setIsBuying(prev => ({ ...prev, [listHeroId]: false }));
        },
        onError: () => {
          setIsBuying(prev => ({ ...prev, [listHeroId]: false }));
        }
      }
    );
  };

  const handleDelist = (listHeroId: string) => {
    if (!isAdmin || !adminCapId || !packageId) return;
    
    setIsDelisting(prev => ({ ...prev, [listHeroId]: true }));
    
    const tx = delist(packageId, listHeroId, adminCapId);
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
          setIsDelisting(prev => ({ ...prev, [listHeroId]: false }));
        },
        onError: () => {
          setIsDelisting(prev => ({ ...prev, [listHeroId]: false }));
        }
      }
    );
  };

  const handleChangePrice = (listHeroId: string, price: string) => {
    if (!isAdmin || !adminCapId || !packageId || !price.trim()) return;
    
    setIsChangingPrice(prev => ({ ...prev, [listHeroId]: true }));
    
    const tx = changePrice(packageId, listHeroId, price, adminCapId);
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
          
          setNewPrice(prev => ({ ...prev, [listHeroId]: "" }));
          setRefreshKey(refreshKey + 1);
          setIsChangingPrice(prev => ({ ...prev, [listHeroId]: false }));
        },
        onError: () => {
          setIsChangingPrice(prev => ({ ...prev, [listHeroId]: false }));
        }
      }
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

  const listCardStyle: CSSProperties = {
    ...baseCardStyle,
    padding: "0",
    border: "1px solid rgba(255, 255, 255, 0.09)",
    overflow: "hidden",
  };

  const adminPanelStyle: CSSProperties = {
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid rgba(248, 113, 113, 0.35)",
    background:
      "linear-gradient(135deg, rgba(248, 113, 113, 0.1), rgba(127, 29, 29, 0.2))",
  };

  if (error) {
    return (
      <Card style={baseCardStyle}>
        <Text color="red">Error loading listed heroes: {error.message}</Text>
      </Card>
    );
  }

  if (eventsLoading || isPending || !data) {
    return (
      <Card style={baseCardStyle}>
        <Text>Loading marketplace...</Text>
      </Card>
    );
  }

  if (!listedEvents?.data?.length) {
    return (
      <Flex direction="column" gap="4">
        <Flex align={{ initial: "start", sm: "center" }} justify="between">
          <Heading size="5">Hero Marketplace</Heading>
          <Badge color="blue" size="2">
            0 listings
          </Badge>
        </Flex>
        <Card style={baseCardStyle}>
          <Text>No heroes are currently listed for sale</Text>
        </Card>
      </Flex>
    );
  }

  const listedHeroes = data.filter(obj => obj.data?.content && 'fields' in obj.data.content);

  return (
    <Flex direction="column" gap="4">
      <Flex justify="between" align={{ initial: "start", sm: "center" }}>
        <Flex direction="column" gap="1">
          <Heading size="5">Hero Marketplace</Heading>
          <Text size="2" color="gray">
            Discover listed heroes and make strategic trades in real time.
          </Text>
        </Flex>
        <Flex gap="2" align="center">
          {isAdmin && (
            <Badge color="red" size="2">
              Admin Panel Active
            </Badge>
          )}
          <Badge color="blue" size="2">
            {listedHeroes.length} listings
          </Badge>
        </Flex>
      </Flex>
      
      {listedHeroes.length === 0 ? (
        <Card style={baseCardStyle}>
          <Text>No heroes are currently listed for sale</Text>
        </Card>
      ) : (
        <Box
          style={{
            display: "grid",
            gap: "28px",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {listedHeroes.map((obj) => {
            const listHero = obj.data?.content as any;
            const listHeroId = obj.data?.objectId!;
            const fields = listHero.fields as ListHero;
            const heroFields = fields.nft.fields;
            const priceInSui = Number(fields.price) / 1_000_000_000;

            return (
              <Card key={listHeroId} style={listCardStyle}>
                <Flex direction="column" gap="0">
                  <Box style={{ position: "relative" }}>
                    <img
                      src={heroFields.image_url}
                      alt={heroFields.name}
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
                      color="blue"
                      size="2"
                      style={{ position: "absolute", top: "16px", left: "16px" }}
                    >
                      Power {heroFields.power}
                    </Badge>
                  </Box>

                  <Flex direction="column" gap="3" style={{ padding: "20px" }}>
                    <Flex direction="column" gap="2">
                      <Flex align="center" gap="2">
                        <Heading size="4">{heroFields.name}</Heading>
                        {fields.seller === account?.address && (
                          <Badge color="orange" size="1">
                            Your Listing
                          </Badge>
                        )}
                      </Flex>
                      <Flex align="center" justify="between">
                        <Badge color="green" size="2">
                          {priceInSui.toFixed(2)} SUI
                        </Badge>
                        <Text size="2" color="gray">
                          Seller {fields.seller.slice(0, 6)}...{fields.seller.slice(-4)}
                        </Text>
                      </Flex>
                    </Flex>

                    <Button
                      onClick={() => handleBuy(listHeroId, priceInSui.toString())}
                      disabled={!account || isBuying[listHeroId]}
                      loading={isBuying[listHeroId]}
                      color="green"
                    >
                      {!account
                        ? "Connect Wallet to Buy"
                        : isBuying[listHeroId]
                          ? "Buying..."
                          : `Buy for ${priceInSui.toFixed(2)} SUI`}
                    </Button>

                    {isAdmin && (
                      <Box style={adminPanelStyle}>
                        <Flex align="center" gap="2" mb="2">
                          <Text size="2" color="gray">
                            Admin Controls
                          </Text>
                        </Flex>

                        <Tabs.Root defaultValue="delist">
                          <Tabs.List
                            size="2"
                            style={{ width: "100%", marginBottom: "12px" }}
                          >
                            <Tabs.Trigger value="delist" style={{ flex: 1 }}>
                              Delist
                            </Tabs.Trigger>
                            <Tabs.Trigger value="price" style={{ flex: 1 }}>
                              Change Price
                            </Tabs.Trigger>
                          </Tabs.List>

                          <Tabs.Content value="delist">
                            <Flex direction="column" gap="2">
                              <Text size="2" color="gray">
                                Remove this hero from the marketplace.
                              </Text>
                              <Button
                                onClick={() => handleDelist(listHeroId)}
                                disabled={isDelisting[listHeroId]}
                                loading={isDelisting[listHeroId]}
                                color="red"
                                size="2"
                              >
                                {isDelisting[listHeroId] ? "Delisting..." : "Delist Hero"}
                              </Button>
                            </Flex>
                          </Tabs.Content>

                          <Tabs.Content value="price">
                            <Flex direction="column" gap="2">
                              <Text size="2" color="gray">
                                Current price: {priceInSui.toFixed(2)} SUI
                              </Text>
                              <TextField.Root
                                placeholder="Enter new price in SUI"
                                type="number"
                                size="2"
                                value={newPrice[listHeroId] || ""}
                                onChange={(e) =>
                                  setNewPrice((prev) => ({
                                    ...prev,
                                    [listHeroId]: e.target.value,
                                  }))
                                }
                              />
                              <Button
                                onClick={() =>
                                  handleChangePrice(listHeroId, newPrice[listHeroId])
                                }
                                disabled={
                                  !newPrice[listHeroId]?.trim() ||
                                  isChangingPrice[listHeroId]
                                }
                                loading={isChangingPrice[listHeroId]}
                                color="orange"
                                size="2"
                              >
                                {isChangingPrice[listHeroId]
                                  ? "Updating Price..."
                                  : "Update Price"}
                              </Button>
                            </Flex>
                          </Tabs.Content>
                        </Tabs.Root>
                      </Box>
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
