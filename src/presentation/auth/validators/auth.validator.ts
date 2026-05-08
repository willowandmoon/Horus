import {ZodSchema, ZodError } from "zod";
import {formatZodError} from "next/dist/shared/lib/zod";

interface ValidationSuccess<T> {
    success: true;
    data: T;
}

interface ValidationFailure {
    success: false;
    errors: Record<string, string> // { field: "mensaje de error" }
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validate<T>(
    schema: ZodSchema<T>,
    data: unknown
): ValidationResult<T> {
    const result = schema.safeParse(data);

    if (result.success) {
        return {success: true, data: result.data};
    }

    const errors = formatZodErrors(result.error);

    return {success: false, errors};
}

function formatZodErrors(error: ZodError): Record<string, string> {
    return error.issues.reduce<Record<string, string>>((acc, issue) => {
        const field = issue.path.join(".");
        if (!acc[field]) {
            acc[field] = issue.message;
        }
        return acc;
    }, {});
}