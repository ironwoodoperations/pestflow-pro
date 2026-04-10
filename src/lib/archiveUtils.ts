import type { SupabaseClient } from '@supabase/supabase-js'

export async function archiveRecord(
  table: string,
  id: string,
  supabase: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from(table)
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  return { error: error?.message ?? null }
}

export async function restoreRecord(
  table: string,
  id: string,
  supabase: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from(table)
    .update({ archived_at: null })
    .eq('id', id)
  return { error: error?.message ?? null }
}

export async function hardDeleteRecord(
  table: string,
  id: string,
  supabase: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
  return { error: error?.message ?? null }
}
