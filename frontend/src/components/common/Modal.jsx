import { useEffect } from 'react';
import Button from './Button';
import './Modal.css';

function Modal({ title, children, onClose, showCloseButton = true }) {
    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal">
                <div className="modal__header">
                    <h2 className="modal__title">{title}</h2>
                    {showCloseButton && (
                        <Button
                            variant="ghost"
                            size="small"
                            onClick={onClose}
                            className="modal__close"
                        >
                            ✕
                        </Button>
                    )}
                </div>

                <div className="modal__content">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default Modal;