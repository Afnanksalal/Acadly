import { NextRequest } from "next/server"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"
import { createClient } from "@supabase/supabase-js"
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from "@/lib/api-response"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

// Magic numbers for file type validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]] // RIFF header
}

function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType]
  if (!signatures) return false
  
  return signatures.some(signature => {
    return signature.every((byte, index) => buffer[index] === byte)
  })
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = createRouteHandlerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return unauthorizedResponse("Login required")
    }

    // Get form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return validationErrorResponse("No file provided")
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return validationErrorResponse("File size must be less than 5MB")
    }

    // Validate file size minimum (prevent empty files)
    if (file.size < 100) {
      return validationErrorResponse("File is too small or corrupted")
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return validationErrorResponse("Only JPEG, PNG, WebP, and GIF images are allowed")
    }

    // Validate file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      return validationErrorResponse("Invalid file extension")
    }

    // Convert File to Buffer for validation
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate file signature (magic numbers) to prevent MIME type spoofing
    if (!validateFileSignature(buffer, file.type)) {
      return validationErrorResponse("File content does not match the declared type. Possible file corruption or security issue.")
    }

    // Create Supabase admin client for storage
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate unique filename with sanitized extension
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Upload to Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      
      // Provide helpful error messages
      let message = "Failed to upload image"
      if (error.message?.includes('Bucket not found')) {
        message = "Storage bucket not configured. Please create 'images' bucket in Supabase Storage."
      } else if (error.message?.includes('permission')) {
        message = "Storage permissions not set. Please configure storage policies."
      }
      
      return errorResponse(new Error(message), 500)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(fileName)

    return successResponse({ 
      url: publicUrl,
      filename: fileName 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return errorResponse(error, 500)
  }
}

// Delete image
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createRouteHandlerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return unauthorizedResponse("Login required")
    }

    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return validationErrorResponse("Filename required")
    }

    // Verify user owns the file (filename starts with user ID)
    if (!filename.startsWith(user.id)) {
      return errorResponse(new Error("Cannot delete other users' files"), 403)
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin.storage
      .from('images')
      .remove([filename])

    if (error) {
      console.error('Delete error:', error)
      return errorResponse(new Error("Failed to delete image"), 500)
    }

    return successResponse({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    return errorResponse(error, 500)
  }
}
