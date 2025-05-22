interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
  className?: string;
}

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  className = "",
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] bg-white rounded-xl p-6 pt-0 shadow-lg animate-slide-in ${className}`}
      style={{ maxHeight: '90vh', overflowY: 'auto' }}
    >
      {showCloseButton && (
        <div className="sticky top-0 w-full bg-white z-10 flex justify-end pt-2">
          <button
            className="text-xl text-gray-500 hover:text-gray-800"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
      )}
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  );
};

export default Modal;
