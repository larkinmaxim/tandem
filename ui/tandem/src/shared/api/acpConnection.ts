import { GooseClient } from "@aaif/goose-sdk";
import { GooseConnection } from "@/infra/goose/GooseConnection";

export const sharedConnection = new GooseConnection();

export async function getClient(): Promise<GooseClient> {
  return sharedConnection.getClient();
}
