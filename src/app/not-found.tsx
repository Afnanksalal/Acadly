import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-muted shadow-lg rounded-lg p-8 text-center border border-border">
        <div className="mb-6">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Page Not Found
          </h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
          >
            Go back home
          </Link>
          
          <Link
            href="/listings"
            className="block w-full bg-background text-foreground py-2 px-4 rounded-md hover:bg-muted transition-colors border border-border"
          >
            Browse listings
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Need help? Contact{" "}
            <a
              href="mailto:support@acadly.in"
              className="text-primary hover:underline"
            >
              support@acadly.in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}