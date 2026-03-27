import React, { useState, useEffect, useRef } from 'react';

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  // niente '#...' in URL
  window.history.replaceState({}, "", window.location.pathname);
}

const NavButton = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-sm text-gray-300 transition-colors hover:text-white"
  >
    {children}
  </button>
);

export function Navbar({
  onLogin,
  onSignup,
  onProfile,
  isLoggedIn = false,
  navLabels,
}) {
  const labels = {
    howItWorks: navLabels?.howItWorks ?? "How it works",
    faq: navLabels?.faq ?? "FAQ",
    profile: navLabels?.profile ?? "Profile",
  }
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const shapeTimeoutRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass('rounded-xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const logoElement = (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 top-0 left-1/2 transform -translate-x-1/2 opacity-80"></span>
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 left-0 top-1/2 transform -translate-y-1/2 opacity-80"></span>
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 right-0 top-1/2 transform -translate-y-1/2 opacity-80"></span>
      <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 bottom-0 left-1/2 transform -translate-x-1/2 opacity-80"></span>
    </div>
  );

  const navLinksData = [
    { label: labels.howItWorks, onClick: () => scrollToId("how-it-works") },
    { label: labels.faq, onClick: () => scrollToId("faq") },
    { label: labels.profile, onClick: onProfile || onSignup },
  ]

  const loginButtonElement = (
    <button
      type="button"
      onClick={onLogin}
      className="px-4 py-2 sm:px-3 text-xs sm:text-sm border border-[#333] bg-[rgba(31,31,31,0.62)] text-gray-300 rounded-full hover:border-white/50 hover:text-white transition-colors duration-200 w-full sm:w-auto"
    >
      Accedi
    </button>
  );

  const signupButtonElement = (
    <button
      type="button"
      onClick={onSignup}
      className="w-full px-4 py-2 text-xs font-semibold text-black transition-all duration-200 bg-gradient-to-br rounded-full sm:w-auto sm:px-3 sm:text-sm from-gray-100 to-gray-300 hover:from-gray-200 hover:to-gray-400"
    >
      Inizia gratis
    </button>
  );

  return (
    <header className={`fixed top-6 left-1/2 z-[100] flex -translate-x-1/2 transform flex-col items-center border border-[#333] bg-[#1f1f1f57] py-3 pl-6 pr-6 backdrop-blur-sm transition-[border-radius] duration-0 ease-in-out sm:w-auto w-[calc(100%-2rem)] ${headerShapeClass}`}>
      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
        <div className="flex items-center">{logoElement}</div>
        <nav className="hidden sm:flex items-center space-x-3 sm:space-x-5 text-[13px] sm:text-sm">
          {navLinksData.map((link) => (
            <NavButton key={link.label} onClick={link.onClick}>
              {link.label}
            </NavButton>
          ))}
        </nav>
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          {!isLoggedIn ? (
            <>
              {loginButtonElement}
              {signupButtonElement}
            </>
          ) : null}
        </div>
        <button className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none" onClick={toggleMenu} aria-label={isOpen ? 'Close Menu' : 'Open Menu'}>
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          )}
        </button>
      </div>
      <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
        <nav className="flex flex-col items-center space-y-4 text-base w-full">
          {navLinksData.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => {
                link.onClick?.();
                setIsOpen(false);
              }}
              className="text-gray-300 hover:text-white transition-colors w-full text-center"
            >
              {link.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-center space-y-4 mt-4 w-full">
          {!isLoggedIn ? (
            <>
              {loginButtonElement}
              {signupButtonElement}
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}