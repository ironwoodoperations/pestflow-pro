export async function notifyTeams(message: string): Promise<void> {
  const webhookUrl = Deno.env.get('TEAMS_WEBHOOK_URL')
  if (!webhookUrl || webhookUrl === 'PLACEHOLDER') return
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })
  } catch (e) {
    console.error('[teams notify]', e)
  }
}
