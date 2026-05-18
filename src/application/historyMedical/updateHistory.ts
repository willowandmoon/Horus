import { historyRepository } from '@/src/infrastucture/database/historyRepository';
import {
  HistoryMedical,
  HistoryMedicalUpdate,
} from '@/src/types/historyMedical';

export async function updateHistory(
  id: string,
  data: HistoryMedicalUpdate
): Promise<HistoryMedical | null> {
  try {
    const updatedHistory = await historyRepository.update(id, data);
    return updatedHistory;
  } catch (error) {
    console.error('Error in updateHistory use case:', error);
    throw new Error('Failed to update medical history');
  }
}
