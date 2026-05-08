import { deleteHistory } from "@/src/infrastucture/database/historyRepository";

export async function deleteHistoryUseCase(id: string) {
  return await deleteHistory(id);
}