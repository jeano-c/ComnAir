// src/components/Modal.tsx
import React, { useEffect } from "react";
import { FaXmark } from "react-icons/fa6";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string; // e.g., "max-w-md", "max-w-lg"
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: ModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Don't render anything if the modal is closed
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose} // Clicking the backdrop closes the modal
    >
      <div
        className={`bg-white rounded-3xl p-6 md:p-8 w-full ${maxWidth} shadow-2xl animate-in fade-in zoom-in duration-200`}
        onClick={(e) => e.stopPropagation()} // Clicking inside the modal prevents it from closing
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-2"
          >
            <FaXmark className="text-xl" />
          </button>
        </div>

        {/* Render whatever form or content is passed into the modal */}
        {children}
      </div>
    </div>
  );
}
