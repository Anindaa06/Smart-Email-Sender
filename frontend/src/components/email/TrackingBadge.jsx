import Badge from '../ui/Badge'

const TrackingBadge = ({ opens = 0, clicks = 0, openRate = 0, clickRate = 0 }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge status="info">Opens: {opens}</Badge>
      <Badge status="info">Clicks: {clicks}</Badge>
      <Badge status="success">Open Rate: {openRate}%</Badge>
      <Badge status="success">Click Rate: {clickRate}%</Badge>
    </div>
  )
}

export default TrackingBadge
