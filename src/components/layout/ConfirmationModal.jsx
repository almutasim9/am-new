import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  titleAr,
  message, 
  messageAr,
  confirmText = 'Confirm',
  confirmTextAr = 'تأكيد',
  type = 'danger',
  isLoading = false 
}) => {
  const themes = {
    danger: {
      icon: Trash2,
      color: '#ef4444',
      bg: '#fff1f2',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
    },
    success: {
      icon: RotateCcw,
      color: '#10b981',
      bg: '#ecfdf5',
      gradient: 'linear-gradient(135deg, #10b981, #059669)'
    },
    warning: {
      icon: AlertTriangle,
      color: '#f59e0b',
      bg: '#fffbeb',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
    }
  };

  const theme = themes[type] || themes.danger;
  const Icon = theme.icon;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="confirm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="dialog-overlay-premium"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="confirmation-modal-premium"
            onClick={e => e.stopPropagation()}
          >
            <button className="modal-close-x" onClick={onClose}>
              <X size={20} />
            </button>

            <div className="modal-icon-container">
              <div className="modal-icon-badge" style={{ color: theme.color, background: theme.bg }}>
                <Icon size={32} />
              </div>
            </div>

            <div className="modal-text-content">
              <h2>{title}</h2>
              <h3>{titleAr}</h3>
              <p>{message}</p>
              <p className="ar-p">{messageAr}</p>
            </div>

            <div className="modal-actions-v2">
              <button
                className="btn-modal-base btn-modal-cancel"
                onClick={onClose}
              >
                Cancel / إلغاء
              </button>
              <button
                className="btn-modal-base btn-modal-confirm"
                onClick={onConfirm}
                disabled={isLoading}
                style={{ background: theme.gradient }}
              >
                {isLoading ? (
                  <div className="loader-small"></div>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span style={{ fontSize: '0.85rem' }}>{confirmText} / {confirmTextAr}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmationModal;
