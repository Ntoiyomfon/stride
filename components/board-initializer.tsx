'use client'

export function BoardInitializer() {
  const handleInitBoard = async () => {
    try {
      // Refresh the page to trigger board initialization
      window.location.reload()
    } catch (error) {
      console.error('❌ Error refreshing page:', error)
    }
  }

  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold mb-4">No board found</h2>
      <p className="text-muted-foreground mb-6">
        It looks like your job tracking board hasn't been created yet. This usually happens automatically during signup.
      </p>
      <button 
        onClick={handleInitBoard}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Refresh Page
      </button>
    </div>
  )
}