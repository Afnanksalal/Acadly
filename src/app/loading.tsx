export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <div className="text-lg font-medium text-foreground mb-2">Loading Acadly...</div>
        <div className="text-sm text-muted-foreground">Please wait while we prepare your content</div>
      </div>
    </div>
  )
}