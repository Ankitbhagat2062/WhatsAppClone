import React, { useState } from 'react';
import useThemeStore from '../../store/themeStore';
import SupportModal from './SupportModal'; // Import the modal component
import LicenseModal from './Licence'; // Import the modal component
import { FaQuestionCircle } from 'react-icons/fa';
import Layout from '../../Components/Layout';
import { IoIosContact } from "react-icons/io";
import { FcRating } from "react-icons/fc";
import { SiUnlicense } from "react-icons/si";

const Help = () => {
  const { theme } = useThemeStore();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);

  const links = [
    { Icon: IoIosContact, label: "Contact us", action: () => setModalOpen(true) },
    { Icon: FcRating, label: "Rate The App", action: () => window.open("https://www.web.com/rate") },
    { Icon: FaQuestionCircle, label: "Help Center", action: () => window.open("https://www.web.com/help") },
    { Icon: SiUnlicense, label: "Licenses", action: () => setIsLicenseOpen(true) }
  ];

  return (
    <div>
      <Layout>
        <div
          className={`flex flex-col h-screen ${theme === "dark" ? "bg-[#152128] text-white" : "bg-white text-black"
            }`}
        >
          {/* Main Content */}
          <div className="flex-grow p-4">
            <h1 className="text-2xl font-bold mb-2">Help</h1>
            <p className="text-lg mb-1">ChatSphere for Windows</p>
            <p className="text-sm mb-4 text-gray-500">Version 2.2532.3.0</p>

            <hr className="my-4 border-gray-200" />

            <h2 className="text-lg font-semibold mb-2">Contact us</h2>
            <p className="mb-4">We'd like to know your thoughts about this app.</p>

            <div className="space-y-3">
              {links.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="flex items-center text-green-600 underline hover:text-green-800"
                >
                  <item.Icon className="mr-2" />
                  {item.label}
                </button>
              ))}
              <SupportModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
              <LicenseModal isOpen={isLicenseOpen} onClose={() => setIsLicenseOpen(false)} />
            </div>
          </div>

          {/* Footer fixed to bottom */}
          <footer className="mt-auto p-4 text-sm text-center border-t border-gray-200">
            <p>
              2025 <span className="inline-block">©</span> ChatSphere Inc.
            </p>
          </footer>
        </div>
      </Layout>
    </div >
  );
};

export default Help;
