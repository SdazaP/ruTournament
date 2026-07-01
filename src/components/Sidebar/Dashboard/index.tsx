import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../../images/logo/logo.png';
import {FiHome} from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true',
  );

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector('body')?.classList.add('sidebar-expanded');
    } else {
      document.querySelector('body')?.classList.remove('sidebar-expanded');
    }
  }, [sidebarExpanded]);

  const handleLogout = () => {
    // Aquí puedes agregar la lógica para cerrar sesión
    console.log('Sesión cerrada');
    navigate('/');
  };

  return (
    <>
      {/* */}
      <div
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setSidebarOpen(false); }}
        className={`fixed inset-0 z-[999] bg-black/50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      ></div>

      <aside
        ref={sidebar}
        className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden dark:bg-boxdark bg-white duration-300 ease-linear lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 shrink-0">
          <NavLink to="/dashboard">
            <img src={Logo} className="invert dark:invert-0" alt="Logo" />
          </NavLink>

          <button
            ref={trigger}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
            className="block lg:hidden"
          >
            <svg
              className="fill-current"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
                fill=""
              />
            </svg>
          </button>
        </div>

        {/* */}
        <div className="no-scrollbar flex flex-col flex-1 overflow-y-auto duration-300 ease-linear">
          <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              MENU
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              {/* */}
              <li>
                <NavLink
                  to="/dashboard"
                  className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium dark:text-bodydark1 text-gray-900 duration-300 ease-in-out dark:hover:bg-graydark hover:bg-gray-100 ${
                    pathname === '/dashboard' && 'bg-gray-100 dark:bg-meta-4'
                  }`}
                >
                  <FiHome size={18} />
                  Inicio
                </NavLink>
              </li>

              {/* */}
              <li>
                <NavLink
                  to="/dashboard/tournaments"
                  className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium dark:text-bodydark1 text-gray-900 duration-300 ease-in-out dark:hover:bg-graydark hover:bg-gray-100 ${
                    pathname.includes('tournaments') && 'bg-gray-100 dark:bg-meta-4'
                  }`}
                >
                  <svg
                    className="fill-current"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 2H13V5.5C13 7.70914 11.2091 9.5 9 9.5C6.79086 9.5 5 7.70914 5 5.5V2Z"
                      fill=""
                    />
                    <path
                      d="M8 9.5H10V14H13V16H5V14H8V9.5Z"
                      fill=""
                    />
                    <path
                      d="M5 2.5H3.5C2.11929 2.5 1 3.61929 1 5C1 6.38071 2.11929 7.5 3.5 7.5H5V6.5H3.5C2.67157 6.5 2 5.82843 2 5C2 4.17157 2.67157 3.5 3.5 3.5H5V2.5Z"
                      fill=""
                    />
                    <path
                      d="M13 2.5H14.5C15.8807 2.5 17 3.61929 17 5C17 6.38071 15.8807 7.5 14.5 7.5H13V6.5H14.5C15.3284 6.5 16 5.82843 16 5C16 4.17157 15.3284 3.5 14.5 3.5H13V2.5Z"
                      fill=""
                    />
                  </svg>
                  Torneos
                </NavLink>
              </li>

              {/* */}
              <li>
                <NavLink
                  to="new-tournament"
                  className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium dark:text-bodydark1 text-gray-900 duration-300 ease-in-out dark:hover:bg-graydark hover:bg-gray-100 ${
                    pathname.includes('new-tournament') && 'bg-gray-100 dark:bg-meta-4'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="currentColor" stroke="currentColor" strokeWidth="0.7" strokeLinejoin="round">
                    <rect x="1" y="1" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="6.8" y="1" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="12.6" y="1" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="1" y="6.8" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="6.8" y="6.8" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="12.6" y="6.8" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="1" y="12.6" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="6.8" y="12.6" width="4.4" height="4.4" rx="0.5"/>
                    <rect x="12.6" y="12.6" width="4.4" height="4.4" rx="0.5"/>
                  </svg>

                  Nuevo Torneo
                </NavLink>
              </li>

              {/* */}
              <li>
                <NavLink
                  to="guide"
                  className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium dark:text-bodydark1 text-gray-900 duration-300 ease-in-out dark:hover:bg-graydark hover:bg-gray-100 ${
                    pathname.includes('guide') && 'bg-gray-100 dark:bg-meta-4'
                  }`}
                >
                  <FaBook />
                  Guía de Usuario
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        {/* */}
        <div className="shrink-0 p-4 lg:p-6 pb-6">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-3.5 rounded-lg bg-graydark py-3 px-6 text-sm font-medium text-white hover:bg-opacity-90"
          >
            <svg
              className="fill-current"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.9 2H9.5C9.22386 2 9 2.22386 9 2.5C9 2.77614 9.22386 3 9.5 3H12.9C13.2315 3 13.5 3.26851 13.5 3.6V12.4C13.5 12.7315 13.2315 13 12.9 13H9.5C9.22386 13 9 13.2239 9 13.5C9 13.7761 9.22386 14 9.5 14H12.9C13.7835 14 14.5 13.2835 14.5 12.4V3.6C14.5 2.71651 13.7835 2 12.9 2Z"
                fill=""
              />
              <path
                d="M6.85355 5.14645C6.65829 4.95118 6.34171 4.95118 6.14645 5.14645C5.95118 5.34171 5.95118 5.65829 6.14645 5.85355L8.29289 8H2.5C2.22386 8 2 8.22386 2 8.5C2 8.77614 2.22386 9 2.5 9H8.29289L6.14645 11.1464C5.95118 11.3417 5.95118 11.6583 6.14645 11.8536C6.34171 12.0488 6.65829 12.0488 6.85355 11.8536L9.85355 8.85355C10.0488 8.65829 10.0488 8.34171 9.85355 8.14645L6.85355 5.14645Z"
                fill=""
              />
            </svg>
            Salir
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;