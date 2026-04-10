import { Pencil, Trash2, User } from 'lucide-react'

export interface TeamMember {
  id: string
  tenant_id: string
  name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  display_order: number
  created_at: string
}

interface Props {
  member: TeamMember
  onEdit: (member: TeamMember) => void
  onDelete: (member: TeamMember) => void
}

export default function TeamMemberCard({ member, onEdit, onDelete }: Props) {
  const handleDelete = () => {
    onDelete(member)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex gap-4">
      <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center">
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <User className="w-7 h-7 text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
        {member.title && <p className="text-xs text-emerald-600 font-medium mt-0.5">{member.title}</p>}
        {member.bio && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {member.bio.length > 80 ? member.bio.slice(0, 80) + '…' : member.bio}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={() => onEdit(member)}
          className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
          title="Edit"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
