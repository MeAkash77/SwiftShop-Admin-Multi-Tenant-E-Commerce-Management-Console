import { useState } from "react";

/**
 * Confirm modal with required reason — suspend / deactivate / danger actions.
 */
export default function AdminReasonModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
  reasonRequired = true,
  reasonLabel = "Reason",
  onCancel,
  onConfirm,
  busy = false,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (reasonRequired && trimmed.length < 3) {
      setError("Enter a short reason (at least 3 characters).");
      return;
    }
    setError("");
    onConfirm(trimmed);
  }

  function handleCancel() {
    setReason("");
    setError("");
    onCancel?.();
  }

  return (
    <div className="aw-modal-backdrop" role="presentation" onClick={handleCancel}>
      <div
        className="aw-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aw-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="aw-modal-title">{title}</h3>
        {description ? <p>{description}</p> : null}
        <form onSubmit={submit}>
          <label
            className="muted"
            htmlFor="aw-reason"
            style={{ display: "block", marginBottom: 6 }}
          >
            {reasonLabel}
            {reasonRequired ? " *" : ""}
          </label>
          <textarea
            id="aw-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
            placeholder="Why is this action needed?"
            disabled={busy}
          />
          {error ? <p className="aw-modal__error">{error}</p> : null}
          <div className="aw-modal__actions">
            <button
              type="button"
              className="panel-btn secondary"
              onClick={handleCancel}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={danger ? "panel-btn danger" : "panel-btn"}
              disabled={busy}
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
