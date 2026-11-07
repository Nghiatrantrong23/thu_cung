import { Link } from 'react-router-dom'
import PetIllustration from '../PetIllustration.jsx'

export default function CustomerEmptyState({ title, description, action, to, state, secondary }) {
  return <div className="customer-empty-state">
    <span className="customer-empty-state__art"><PetIllustration species="Mèo" className="h-16 w-16"/></span>
    <div className="customer-empty-state__copy"><h2>{title}</h2><p>{description}</p>
      {(action || secondary) && <div className="customer-empty-state__actions">
        {to ? <Link to={to} state={state} className="customer-primary-action">{action}</Link> : action}
        {secondary}
      </div>}
    </div>
  </div>
}
