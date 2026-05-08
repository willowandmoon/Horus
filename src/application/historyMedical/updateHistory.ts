import { updateHistory } from "@/src/infrastucture/database/historyRepository";

export async function updateHistoryUseCase(id: string, data: any) {
  return await updateHistory(id, data);
}