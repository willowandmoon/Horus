import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  bytes?: number;
}

export function uploadMedicalDocument(
  buffer: Buffer,
  userId: string,
  filename?: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    console.log(`\n[Cloudinary] Iniciando subida para usuario: ${userId}`);
    console.log(`[Cloudinary] Tamaño del buffer: ${buffer ? buffer.length : 0} bytes`);
    console.log(`[Cloudinary] Nombre del archivo original: ${filename || 'Desconocido'}\n`);

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      console.error("[Cloudinary] ERROR CRÍTICO: Faltan credenciales en el archivo .env (.env.local)");
    }

    if (!buffer || buffer.length === 0) {
      const err = new Error("[Cloudinary] El buffer de la imagen está vacío o es inválido.");
      console.error(err.message);
      return reject(err);
    }

    const folder = `medical-records/${userId}`;

    // Generar un sufijo único usando el timestamp actual 
    // Esto asegura que si se sube el mismo archivo con el mismo nombre, no haya sobreescritura/conflictos.
    const timestamp = Date.now();
    const baseName = filename ? String(filename).replace(/\.[^/.]+$/, '') : 'document';
    const uniquePublicId = `${baseName}_${timestamp}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        // Asignar el ID único generado
        public_id: uniquePublicId,
        // Limpiamos caché de CDN por seguridad en versiones, aunque el unique URL ya resuelve el 99%
        invalidate: true,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          console.error("[Cloudinary] Error de la API de Cloudinary:", error);
          return reject(error || new Error("No se recibió respuesta de Cloudinary"));
        }
        console.log(`[Cloudinary] Subida exitosa! URL: ${result.secure_url}\n`);
        resolve(result as UploadResult);
      }
    );

    // Capturar errores del flujo de datos (streams) que de otra forma son silenciosos
    stream.on('error', (err) => {
      console.error("[Cloudinary] Error interno en el Stream de datos:", err);
      reject(err);
    });

    // Inyectar el buffer en el stream de Cloudinary
    stream.end(buffer);
  });
}

export default cloudinary;
