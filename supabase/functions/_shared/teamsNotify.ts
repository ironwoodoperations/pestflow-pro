export async function notifyTeams(message: string): Promise<void> {
  const webhookUrl = Deno.env.get('TEAMS_WEBHOOK_URL')
  if (!webhookUrl || webhookUrl === 'PLACEHOLDER') return
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
      type: "message",
      attachments: [{
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          type: "AdaptiveCard", version: "1.4",
          body: [{ type: "TextBlock", text: message, wrap: true, size: "Medium" }]
        }
      }]
    }),
    })
  } catch (e) {
    console.error('[teams notify]', e)
  }
}
