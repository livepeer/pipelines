import React from "react";

export function HomePageStyles() {
  return (
    <style jsx global>{`
      @keyframes fadeSlideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideDown {
        from {
          transform: translateY(-100%);
        }
        to {
          transform: translateY(0);
        }
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      @media (max-width: 767px) {
        .mobile-slide-up {
          animation: slideUp 0.3s ease-out !important;
        }
        .mobile-fade-1 {
          opacity: 0.85 !important;
        }
        .mobile-fade-2 {
          opacity: 0.65 !important;
        }
        .mobile-fade-3 {
          opacity: 0.4 !important;
        }
        .mobile-fade-4,
        .mobile-fade-5,
        .mobile-fade-6,
        .mobile-fade-7,
        .mobile-fade-8,
        .mobile-fade-9,
        .mobile-fade-10 {
          opacity: 0.2 !important;
        }
      }
    `}</style>
  );
}
