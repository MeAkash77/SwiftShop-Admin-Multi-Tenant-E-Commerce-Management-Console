import { Link } from "react-router-dom";

const InfoPage = ({ title, children }) => (
  <article className="fk-info-page">
    <nav className="fk-info-breadcrumb">
      <Link to="/customer">Home</Link>
      <span>/</span>
      <span>{title}</span>
    </nav>
    <div className="fk-panel fk-info-panel">
      <h1>{title}</h1>
      <div className="fk-info-body">{children}</div>
    </div>
  </article>
);

export default InfoPage;
