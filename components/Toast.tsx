/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 2000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Because of the key in the parent, this component remounts for each new message.
    if (message) {
      // Start the fade-in animation slightly after mount
      const fadeInTimer = setTimeout(() => setIsVisible(true), 10);
      
      // Set a timer to fade out and then call onClose
      const lifeTimer = setTimeout(() => {
        setIsVisible(false);
        // Wait for fade-out animation to finish before calling onClose
        setTimeout(onClose, 300);
      }, duration);

      return () => {
        clearTimeout(fadeInTimer);
        clearTimeout(lifeTimer);
      };
    }
  }, [message, duration, onClose]);

  // The component only renders if there's a key, so `message` will be there.
  if (!message) return null;

  return (
    <div
      aria-live="assertive"
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-green-500/80 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-full shadow-lg shadow-green-500/20">
        {message}
      </div>
    </div>
  );
};

export default Toast;