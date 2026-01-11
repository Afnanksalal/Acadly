export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
        </div>
        <div className="space-y-2">
          <div className="text-lg font-medium text-foreground">Loading...</div>
          <div className="text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    </div>
  )
}