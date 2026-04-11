export async function notifyTeamsFromClient(message: string): Promise<void> {
  try {
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ message }),
    })
  } catch (e) {
    console.error('[teams notify]', e)
  }
}
