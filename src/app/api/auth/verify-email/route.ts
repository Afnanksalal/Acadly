import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api-response"
import { createRouteHandlerSupabaseClient } from "@/lib/supabase-route-handler"

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const type = searchParams.get("type")

    if (!token || type !== "signup") {
      return validationErrorResponse("Invalid verification link")
    }

    // Verify the token with Supabase
    const supabase = createRouteHandlerSupabaseClient()
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "signup",
    })

    if (error || !data.user) {
      console.error("Email verification error:", error)
      return validationErrorResponse("Invalid or expired verification link")
    }

    // Update user verification status in database
    const profile = await prisma.profile.update({
      where: { id: data.user.id },
      data: { verified: true },
      select: {
        id: true,
        email: true,
        verified: true,
        name: true,
        username: true,
      },
    })

    return successResponse({
      message: "Email verified successfully",
      user: profile,
    })
  } catch (error) {
    console.error("Error verifying email:", error)
    return errorResponse(error, 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const type = searchParams.get("type")

    if (!token || type !== "signup") {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Verification Link - Acadly</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8fafc; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
            .error { color: #dc2626; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Invalid Verification Link</h1>
            <p>This verification link is invalid or has expired.</p>
            <a href="/auth/login" class="button">Go to Login</a>
          </div>
        </body>
        </html>
        `,
        {
          headers: { "Content-Type": "text/html" },
          status: 400,
        }
      )
    }

    // Verify the token with Supabase
    const supabase = createRouteHandlerSupabaseClient()
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "signup",
    })

    if (error || !data.user) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed - Acadly</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8fafc; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
            .error { color: #dc2626; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Verification Failed</h1>
            <p>This verification link has expired or is invalid. Please request a new verification email.</p>
            <a href="/auth/login" class="button">Go to Login</a>
          </div>
        </body>
        </html>
        `,
        {
          headers: { "Content-Type": "text/html" },
          status: 400,
        }
      )
    }

    // Update user verification status in database
    await prisma.profile.update({
      where: { id: data.user.id },
      data: { verified: true },
    })

    // Return success page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified - Acadly</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8fafc; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
          .success { color: #059669; }
          .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .emoji { font-size: 48px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="emoji">✅</div>
          <h1 class="success">Email Verified Successfully!</h1>
          <p>Your email has been verified. You can now access all features of Acadly.</p>
          <a href="/dashboard" class="button">Go to Dashboard</a>
        </div>
      </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error verifying email:", error)
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error - Acadly</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8fafc; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
          .error { color: #dc2626; }
          .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">Verification Error</h1>
          <p>An error occurred while verifying your email. Please try again or contact support.</p>
          <a href="/auth/login" class="button">Go to Login</a>
        </div>
      </body>
      </html>
      `,
      {
        headers: { "Content-Type": "text/html" },
        status: 500,
      }
    )
  }
}