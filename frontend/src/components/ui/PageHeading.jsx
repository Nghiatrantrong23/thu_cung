export default function PageHeading({ title, description, actions }) {
  return <header className="pc-page-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="pc-page-actions">{actions}</div>}</header>
}
