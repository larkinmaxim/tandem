import type { ProviderInventoryEntryDto } from "@aaif/goose-sdk";
import { getClient } from "@/shared/api/acpConnection";

export async function getProviderInventory(
  providerIds: string[] = [],
): Promise<ProviderInventoryEntryDto[]> {
  const client = await getClient();
  const response = await client.goose.GooseProvidersList({ providerIds });
  return response.entries;
}
