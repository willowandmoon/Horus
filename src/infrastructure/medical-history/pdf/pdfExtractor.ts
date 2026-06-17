import pdf from 'pdf-parse';

export async function extractTextFromPDF(
  buffer: Buffer
): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error: Omit<Error, never> | unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error extracting text from PDF:', errorMsg);
    throw new Error(`Failed to extract text from PDF: ${errorMsg}`);
  }
}
