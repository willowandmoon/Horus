import cloudinary from "@/src/infrastucture/database/cloudinary";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return Response.json(
        {
          error: "File is required"
        },
        {
          status: 400
        }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64File, {
      folder: "medical-records",
      resource_type: "auto"
    });

    return Response.json({
      message: "Document uploaded successfully",
      data: result
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return Response.json(
      {
        error: String(error)
      },
      {
        status: 500
      }
    );
  }
}