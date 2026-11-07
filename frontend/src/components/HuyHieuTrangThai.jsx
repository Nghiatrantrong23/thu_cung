import StatusBadge from './ui/StatusBadge.jsx'

export default function HuyHieuTrangThai({ status }) {
  const domain = ['Đang theo dõi', 'Ngừng theo dõi'].includes(status) ? 'pet' : 'appointment'
  return <StatusBadge domain={domain} code={status}/>
}
