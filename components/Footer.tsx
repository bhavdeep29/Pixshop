/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 px-8 text-center">
      <p className="text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Pixshop. All rights reserved.
      </p>
      <p className="text-gray-600 text-xs mt-1">
        Developed by Bhavdeep
      </p>
    </footer>
  );
};

export default Footer;
