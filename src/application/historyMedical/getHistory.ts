import { getHistory } from "@/src/infrastucture/database/historyRepository";

export async function getHistoryUseCase() {
  return await getHistory();
}