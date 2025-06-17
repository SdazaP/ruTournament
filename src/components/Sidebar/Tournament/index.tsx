import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import SidebarLinkGroup from './SidebarLinkGroup';
import Logo from '../../../images/logo/logo.png';

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

  const handleGoBack = () => {
    navigate(-1); // Navega a la página anterior
  };

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <NavLink to="/">
          <img src={Logo} alt="Logo" />
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
      {/* <!-- SIDEBAR HEADER --> */}

      {/* <!-- USER PROFILE IMAGE --> */}
      <div className="flex flex-col items-center py-4">
        <NavLink
          to="/tournament"
          className="rounded-full border-4 border-white p-1"
        >
          <img
            src=""
            alt="Logo Tournament"
            className="h-20 w-20 rounded-full object-cover"
          />
        </NavLink>
        <span className="mt-2 text-sm font-medium text-white">
          Nombre de Torneo
        </span>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        {/* <!-- Sidebar Menu --> */}
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          {/* <!-- Menu Group --> */}
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              MENU
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              {/* <!-- Menu Item Participantes --> */}
              <li>
                <NavLink
                  to="/dashboard/tournament"
                  className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                    pathname === '/dashboard' && 'bg-graydark dark:bg-meta-4'
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
                      d="M9.00002 2.025L2.70002 7.125V15.3H6.30002V10.8H11.7V15.3H15.3V7.125L9.00002 2.025ZM9.00002 4.275L13.5 7.65V13.5H12.6V9H5.40002V13.5H4.50002V7.65L9.00002 4.275Z"
                      fill=""
                    />
                  </svg>
                  Inicio
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="competitors"
                  className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                    pathname.includes('participants') &&
                    'bg-graydark dark:bg-meta-4'
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
                      d="M9.0002 7.79065C11.0814 7.79065 12.7689 6.1594 12.7689 4.1344C12.7689 2.1094 11.0814 0.478149 9.0002 0.478149C6.91895 0.478149 5.23145 2.1094 5.23145 4.1344C5.23145 6.1594 6.91895 7.79065 9.0002 7.79065ZM9.0002 1.7719C10.3783 1.7719 11.5033 2.84065 11.5033 4.16252C11.5033 5.4844 10.3783 6.55315 9.0002 6.55315C7.62207 6.55315 6.49707 5.4844 6.49707 4.16252C6.49707 2.84065 7.62207 1.7719 9.0002 1.7719Z"
                      fill=""
                    />
                    <path
                      d="M10.8283 9.05627H7.17207C4.16269 9.05627 1.71582 11.5313 1.71582 14.5406V16.875C1.71582 17.2125 1.99707 17.5219 2.3627 17.5219C2.72832 17.5219 3.00957 17.2407 3.00957 16.875V14.5406C3.00957 12.2344 4.89394 10.3219 7.22832 10.3219H10.8564C13.1627 10.3219 15.0752 12.2063 15.0752 14.5406V16.875C15.0752 17.2125 15.3564 17.5219 15.7221 17.5219C16.0877 17.5219 16.3689 17.2407 16.3689 16.875V14.5406C16.2846 11.5313 13.8377 9.05627 10.8283 9.05627Z"
                      fill=""
                    />
                  </svg>
                  Participantes
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="categories"
                  className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                    pathname.includes('categories') &&
                    'bg-graydark dark:bg-meta-4'
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
                    <path d="M6 3H3V6H6V3Z" fill="#FF0000" />{' '}
                    <path d="M9 3H6V6H9V3Z" fill="#FFFFFF" />
                    <path d="M12 3H9V6H12V3Z" fill="#0000FF" />
                    <path d="M6 6H3V9H6V6Z" fill="#FFFFFF" />
                    <path d="M9 6H6V9H9V6Z" fill="#0000FF" />
                    <path d="M12 6H9V9H12V6Z" fill="#FFD700" />
                    <path d="M6 9H3V12H6V9Z" fill="#0000FF" />
                    <path d="M9 9H6V12H9V9Z" fill="#FFD700" />
                    <path d="M12 9H9V12H12V9Z" fill="#FF0000" />
                    <path d="M6 3V12" stroke="#000000" stroke-width="0.5" />
                    <path d="M9 3V12" stroke="#000000" stroke-width="0.5" />
                    <path d="M3 6H12" stroke="#000000" stroke-width="0.5" />
                    <path d="M3 9H12" stroke="#000000" stroke-width="0.5" />
                    <path d="M12 3L15 5L15 8L12 6V3Z" fill="#990000" />{' '}
                    <path d="M3 12L6 12L9 15L6 15L3 12Z" fill="#CCCCCC" />{' '}
                    
                  </svg>
                  Categorías y Horarios
                </NavLink>
              </li>

              {/* <!-- Menu Item Resultados --> */}
              <SidebarLinkGroup activeCondition={pathname.includes('results')}>
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      <NavLink
                        to="#"
                        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          pathname.includes('results') &&
                          'bg-graydark dark:bg-meta-4'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        {/* Icono principal actualizado - Tabla de posiciones */}
                        <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3 3H15C15.825 3 16.5 3.675 16.5 4.5V13.5C16.5 14.325 15.825 15 15 15H3C2.175 15 1.5 14.325 1.5 13.5V4.5C1.5 3.675 2.175 3 3 3ZM3 4.5V6H15V4.5H3ZM3 7.5V9H9V7.5H3ZM10.5 7.5V9H15V7.5H10.5ZM3 10.5V12H6V10.5H3ZM7.5 10.5V12H15V10.5H7.5Z"
                            fill=""
                          />
                        </svg>
                        Gestionar Resultados
                        <svg
                          className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${
                            open && 'rotate-180'
                          }`}
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                            fill=""
                          />
                        </svg>
                      </NavLink>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={`translate transform overflow-hidden ${
                          !open && 'hidden'
                        }`}
                      >
                        <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                          <li>
                            <NavLink
                              to="results/WCA"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              {/* Icono WCA - Cubo Rubik */}
                              <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M5.25 3H3V5.25H5.25V3Z" fill="" />
                                <path d="M9 3H6.75V5.25H9V3Z" fill="" />
                                <path d="M12.75 3H10.5V5.25H12.75V3Z" fill="" />
                                <path d="M5.25 6.75H3V9H5.25V6.75Z" fill="" />
                                <path d="M9 6.75H6.75V9H9V6.75Z" fill="" />
                                <path
                                  d="M12.75 6.75H10.5V9H12.75V6.75Z"
                                  fill=""
                                />
                                <path
                                  d="M5.25 10.5H3V12.75H5.25V10.5Z"
                                  fill=""
                                />
                                <path d="M9 10.5H6.75V12.75H9V10.5Z" fill="" />
                                <path
                                  d="M12.75 10.5H10.5V12.75H12.75V10.5Z"
                                  fill=""
                                />
                              </svg>
                              Formato WCA
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              to="results/RB"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              {/* Icono RB - Copa/Trofeo */}
                              <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M9 12.75C12.7279 12.75 15.75 9.72792 15.75 6H13.5C13.5 8.48528 11.4853 10.5 9 10.5C6.51472 10.5 4.5 8.48528 4.5 6H2.25C2.25 9.72792 5.27208 12.75 9 12.75Z"
                                  fill=""
                                />
                                <path
                                  d="M5.25 13.5V15.75H12.75V13.5H5.25Z"
                                  fill=""
                                />
                                <path d="M6.75 3V6H11.25V3H6.75Z" fill="" />
                              </svg>
                              Formato RB
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                      {/* <!-- Dropdown Menu End --> */}
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
              <SidebarLinkGroup activeCondition={pathname.includes('view')}>
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      <NavLink
                        to="#"
                        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                          pathname.includes('view') &&
                          'bg-graydark dark:bg-meta-4'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        {/* Icono principal actualizado - Ojo/visualización */}
                        <svg
                          className="fill-current"
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9 3.75C5.25 3.75 2.0475 6.3225 1.2 9.75C2.0475 13.1775 5.25 15.75 9 15.75C12.75 15.75 15.9525 13.1775 16.8 9.75C15.9525 6.3225 12.75 3.75 9 3.75ZM9 13.5C6.93 13.5 5.25 11.82 5.25 9.75C5.25 7.68 6.93 6 9 6C11.07 6 12.75 7.68 12.75 9.75C12.75 11.82 11.07 13.5 9 13.5ZM9 7.5C7.755 7.5 6.75 8.505 6.75 9.75C6.75 10.995 7.755 12 9 12C10.245 12 11.25 10.995 11.25 9.75C11.25 8.505 10.245 7.5 9 7.5Z"
                            fill=""
                          />
                        </svg>
                        Ver Resultados
                        <svg
                          className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${
                            open && 'rotate-180'
                          }`}
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                            fill=""
                          />
                        </svg>
                      </NavLink>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={`translate transform overflow-hidden ${
                          !open && 'hidden'
                        }`}
                      >
                        <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                          <li>
                            <NavLink
                              to="view/resultsWCA"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              {/* Icono WCA - Lista con cubo */}
                              <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M3 3H15V5.25H3V3ZM3 6.75H15V9H3V6.75ZM3 10.5H9V12.75H3V10.5Z"
                                  fill=""
                                />
                                <path d="M12 10.5H15V12.75H12V10.5Z" fill="" />
                                <path d="M10.5 13.5H12V15H10.5V13.5Z" fill="" />
                              </svg>
                              Resultados WCA
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              to="view/resultsRB"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              {/* Icono RB - Podio de competición */}
                              <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M4.5 6.75H3V13.5H4.5V6.75Z" fill="" />
                                <path
                                  d="M9.75 4.5H8.25V13.5H9.75V4.5Z"
                                  fill=""
                                />
                                <path d="M15 9H13.5V13.5H15V9Z" fill="" />
                                <path d="M3 13.5H15V15H3V13.5Z" fill="" />
                              </svg>
                              Resultados RB
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                      {/* <!-- Dropdown Menu End --> */}
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
            </ul>
          </div>

          {/* <!-- Botón de Regresar --> */}
          <div className="mt-8 px-4">
            <button
              onClick={handleGoBack}
              className="flex w-full items-center justify-center gap-3.5 rounded-lg bg-graydark py-3 px-6 text-sm font-medium text-white hover:bg-opacity-90"
            >
              <svg
                className="fill-current"
                width="16"
                height="14"
                viewBox="0 0 16 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.7492 6.38125H2.73984L7.52109 1.51562C7.77422 1.2625 7.77422 0.86875 7.52109 0.615625C7.26797 0.3625 6.87422 0.3625 6.62109 0.615625L0.799219 6.52187C0.546094 6.775 0.546094 7.16875 0.799219 7.42188L6.62109 13.3281C6.73359 13.4406 6.90234 13.525 7.07109 13.525C7.23984 13.525 7.38047 13.4687 7.52109 13.3562C7.77422 13.1031 7.77422 12.7094 7.52109 12.4563L2.76797 7.64687H14.7492C15.0867 7.64687 15.368 7.36562 15.368 7.02812C15.368 6.6625 15.0867 6.38125 14.7492 6.38125Z"
                  fill=""
                />
              </svg>
              Regresar
            </button>
          </div>
        </nav>
        {/* <!-- Sidebar Menu --> */}
      </div>
    </aside>
  );
};

export default Sidebar;
