const AccountPlaceholder = ({ title, description, icon = "fa-solid fa-circle-info" }) => (
  <div className="fk-panel fk-empty-panel">
    <i className={icon} aria-hidden="true" />
    <h1>{title}</h1>
    <p>{description}</p>
  </div>
);

export default AccountPlaceholder;
