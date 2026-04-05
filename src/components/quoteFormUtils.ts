export function validateContactFields(data: { name: string; email: string; phone: string }) {
  const errors: Record<string, string> = {}
  if (!data.name.trim()) errors.name = 'Name is required'
  if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'Enter a valid email address'
  const digits = data.phone.replace(/\D/g, '')
  if (digits.length < 10) errors.phone = 'Enter a valid phone number'
  return errors
}
