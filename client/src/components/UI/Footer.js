// client/src/components/UI/Footer.js
import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>&copy; {currentYear} Financial Ledger App. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
