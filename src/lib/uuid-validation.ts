/**
 * Validates if a string is a valid UUID format (any version)
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
}

/**
 * Validates UUID and returns validation result
 */
export function validateUUIDParam(id: string, entityName: string = "item") {
    // Handle edge cases
    if (!id || typeof id !== 'string' || id === 'undefined' || id === 'null') {
        return {
            isValid: false,
            error: `Invalid ${entityName} ID format`
        }
    }

    if (!isValidUUID(id)) {
        return {
            isValid: false,
            error: `Invalid ${entityName} ID format`
        }
    }

    return { isValid: true, error: null }
}

/**
 * Validates UUID for API routes and returns NextResponse if invalid
 */
export function validateUUIDForAPI(id: string, entityName: string = "item") {
    if (!isValidUUID(id)) {
        return {
            isValid: false as const,
            response: Response.json(
                {
                    error: {
                        code: "INVALID_UUID",
                        message: `Invalid ${entityName} ID format`
                    }
                },
                { status: 400 }
            )
        }
    }

    return { isValid: true as const }
}