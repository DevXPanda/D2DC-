export default function Modal({ title, open, onClose, children, footer, maxWidth = "max-w-lg" }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-panel ${maxWidth}`} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none ring-1 ring-gray-200 p-1">
            <span className="sr-only">Close</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body overflow-y-auto max-h-[75vh] custom-scrollbar">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
