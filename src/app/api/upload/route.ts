import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
    }

    // Get form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ 
        error: { code: "NO_FILE", message: "No file provided" } 
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: { code: "FILE_TOO_LARGE", message: "File size must be less than 5MB" } 
      }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: { code: "INVALID_TYPE", message: "Only JPEG, PNG, WebP, and GIF images are allowed" } 
      }, { status: 400 })
    }

    // Create Supabase admin client for storage
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

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
      
      return NextResponse.json({ 
        error: { 
          code: "UPLOAD_FAILED", 
          message,
          details: error.message 
        } 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      url: publicUrl,
      filename: fileName 
    }, { status: 200 })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Internal server error" } 
    }, { status: 500 })
  }
}

// Delete image
export async function DELETE(req: NextRequest) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: "UNAUTHENTICATED", message: "Login required" } 
      }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json({ 
        error: { code: "NO_FILENAME", message: "Filename required" } 
      }, { status: 400 })
    }

    // Verify user owns the file (filename starts with user ID)
    if (!filename.startsWith(user.id)) {
      return NextResponse.json({ 
        error: { code: "FORBIDDEN", message: "Cannot delete other users' files" } 
      }, { status: 403 })
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
      return NextResponse.json({ 
        error: { code: "DELETE_FAILED", message: "Failed to delete image" } 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ 
      error: { code: "SERVER_ERROR", message: "Internal server error" } 
    }, { status: 500 })
  }
}
