import { getHistory } from "@/src/infrastucture/database/historyRepository";

export async function getHistoryUseCase(userId: string) {
  return await getHistory(userId);
}