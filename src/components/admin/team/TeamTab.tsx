import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useTenant } from '../../../hooks/useTenant'
import PageHelpBanner from '../PageHelpBanner'
import TeamMemberCard, { type TeamMember } from './TeamMemberCard'
import TeamMemberModal from './TeamMemberModal'

export default function TeamTab() {
  const { tenantId } = useTenant()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null)
  const [showModal, setShowModal] = useState(false)

  const fetchMembers = async () => {
    if (!tenantId) return
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('display_order', { ascending: true })
    setMembers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchMembers() }, [tenantId])

  const handleEdit = (member: TeamMember) => {
    setEditTarget(member)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditTarget(null)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const handleSaved = () => { fetchMembers() }

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  )

  return (
    <div>
      <PageHelpBanner
        tab="team"
        title="Team"
        body="Manage your team members shown on your website."
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
        >
          <Plus size={16} />
          Add Team Member
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-3xl mb-3">👤</p>
          <p className="text-lg font-semibold text-gray-900 mb-1">No team members yet</p>
          <p className="text-gray-500 text-sm mb-4">Add your team to build trust with potential customers.</p>
          <button onClick={handleAdd}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition">
            Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <TeamMemberCard key={m.id} member={m} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <TeamMemberModal
          tenantId={tenantId!}
          member={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
