import { historyRepository } from '@../../../src/infrastucture/database/historyRepository';

export async function deleteHistory(id: string): Promise<boolean> {
  try {
    const success = await historyRepository.delete(id);
    return success;
  } catch (error) {
    console.error('Error in deleteHistory use case:', error);
    throw new Error('Failed to delete medical history');
  }
}
