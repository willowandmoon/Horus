import { historyRepository } from '@/src/infrastucture/database/historyRepository';
import { HistoryMedical } from '@/src/types/historyMedical';

export async function getHistory(id: string): Promise<HistoryMedical | null> {
  try {
    const history = await historyRepository.findById(id);
    return history;
  } catch (error) {
    console.error('Error in getHistory use case:', error);
    throw new Error('Failed to get medical history');
  }
}

export async function getHistoryByUserId(userId: string): Promise<HistoryMedical[]> {
  try {
    const histories = await historyRepository.findByUserId(userId);
    return histories;
  } catch (error) {
    console.error('Error in getHistoryByUserId use case:', error);
    throw new Error('Failed to get medical histories by user');
  }
}