import { historyRepository } from '@../../../src/infrastucture/database/historyRepository';
import {
  HistoryMedical,
  HistoryMedicalCreate,
} from '@../../../src/types/historyMedical';

export async function createHistory(
  data: HistoryMedicalCreate
): Promise<HistoryMedical> {
  try {
    // Aquí puedes agregar validaciones de datos antes de crear el historial
    const newHistory = await historyRepository.create(data);
    return newHistory;
  } catch (error) {
    console.error('Error in createHistory use case:', error);
    throw new Error('Failed to create medical history');
  }
}
