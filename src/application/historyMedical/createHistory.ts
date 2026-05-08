import { createHistory } from "@/src/infrastucture/database/historyRepository";

export async function createHistoryUseCase(data: any) {
  // aquí luego puedes validar campos
  return await createHistory(data);
}