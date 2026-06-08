import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import SidebarLinkGroup from './SidebarLinkGroup';
import Logo from '../../../images/logo/logo.png';
import { db } from '../../../common/db';

// Importaciones de react-icons
import {
  FiChevronDown,
  FiHome,
  FiUsers,
  FiCalendar,
  FiAward,
  FiEye,
  FiList,
  FiTrendingUp,
  FiChevronLeft
} from 'react-icons/fi';
import { FaCube, FaSyncAlt, FaLayerGroup, FaClock } from 'react-icons/fa';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const { id } = useParams();

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true',
  );
  const [tournamentName, setTournamentName] = useState('Nombre de Torneo');

  useEffect(() => {
    if (id) {
      db.tournaments.get(id).then((t) => {
        if (t?.name) setTournamentName(t.name);
      });
    }
  }, [id]);

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
    navigate(-1);
  };

  return (
    <>
      {/* <!-- Sidebar Backdrop for Mobile --> */}
      <div
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setSidebarOpen(false); }}
        className={`fixed inset-0 z-[999] bg-black/50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      ></div>

      <aside
        ref={sidebar}
        className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <NavLink to="/dashboard">
          <img src={Logo} alt="Logo" />
        </NavLink>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden"
        >
          <FiChevronLeft className="text-white" size={20} />
        </button>
      </div>

      {/* <!-- USER PROFILE IMAGE --> */}
      <div className="flex flex-col items-center py-4">
        <NavLink
          to={`/dashboard/tournament/${id}`}
          className="rounded-full border-4 border-white p-1"
        >
          <img
            src=""
            alt="Logo Tournament"
            className="h-20 w-20 rounded-full object-cover"
          />
        </NavLink>
        <span className="mt-2 text-sm font-medium text-white truncate px-2 text-center max-w-full">
          {tournamentName}
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
              {/* Inicio */}
              <li>
                <NavLink
                  to={`/dashboard/tournament/${id}`}
                  className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${(pathname === `/dashboard/tournament/${id}` || pathname === `/dashboard/tournament/${id}/`) && 'bg-graydark dark:bg-meta-4'
                    }`}
                >
                  <FiHome size={18} />
                  Inicio
                </NavLink>
              </li>
              {/* Administrar Competidores */}
              <SidebarLinkGroup activeCondition={pathname.includes('competitors') || pathname.includes('staffing') || pathname.includes('groups')}>
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      <NavLink
                        to="#"
                        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${(pathname.includes('competitors') || pathname.includes('staffing') || pathname.includes('groups')) &&
                          'bg-graydark dark:bg-meta-4'
                          }`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <FiUsers size={18} />
                        Administrar Competidores
                        <FiChevronDown
                          className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${open && 'rotate-180'
                            }`}
                          size={20}
                        />
                      </NavLink>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={`translate transform overflow-hidden ${!open && 'hidden'
                          }`}
                      >
                        <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                          <li>
                            <NavLink
                              to="competitors"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              <FaCube size={18} />
                              Competidores
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              to="staffing"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              <FiAward size={18} />
                              Roles de competencia
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              to="groups"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              <FaLayerGroup size={18} />
                              Generador de Horarios
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                      {/* <!-- Dropdown Menu End --> */}
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>
              <SidebarLinkGroup activeCondition={pathname.includes('categories') || pathname.includes('scrambles') || pathname.includes('schedule')}>
                {(handleClick, open) => {
                  return (
                    <React.Fragment>
                      <NavLink
                        to="#"
                        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${(pathname.includes('categories') || pathname.includes('scrambles') || pathname.includes('schedule')) &&
                          'bg-graydark dark:bg-meta-4'
                          }`}
                        onClick={(e) => {
                          e.preventDefault();
                          sidebarExpanded
                            ? handleClick()
                            : setSidebarExpanded(true);
                        }}
                      >
                        <FiList size={18} />
                        Administrar <br />Categorías
                        <FiChevronDown
                          className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${open && 'rotate-180'
                            }`}
                          size={20}
                        />
                      </NavLink>
                      {/* <!-- Dropdown Menu Start --> */}
                      <div
                        className={`translate transform overflow-hidden ${!open && 'hidden'
                          }`}
                      >
                        <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                          <li>
                            <NavLink
                              to="categories"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              <FiCalendar size={18} />
                              Categorías
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              to="schedule"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              <FaClock size={18} />
                              Cronograma
                            </NavLink>
                          </li>
                          <li>
                            <NavLink
                              to="scrambles"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              <FaSyncAlt size={18} />
                              Generador de Mezclas
                            </NavLink>
                          </li>
                        </ul>
                      </div>
                    </React.Fragment>
                  );
                }}
              </SidebarLinkGroup>

              {/* <!-- Menu Item Gestionar Resultados --> */}
              <li>
                <NavLink
                  to="results"
                  className={({ isActive }) =>
                    'group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ' +
                    (isActive && 'bg-graydark dark:bg-meta-4')
                  }
                >
                  <FiTrendingUp size={18} />
                  Gestionar Resultados
                </NavLink>
              </li>
              {/* <!-- Menu Item Ver Resultados --> */}
              <li>
                <NavLink
                  to="view/results"
                  className={({ isActive }) =>
                    'group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ' +
                    (isActive && 'bg-graydark dark:bg-meta-4')
                  }
                >
                  <FiEye size={18} />
                  Ver Resultados
                </NavLink>
              </li>
            </ul>
          </div>

          {/* <!-- Botón de Regresar --> */}
          <div className="mt-8 px-4">
            <button
              onClick={handleGoBack}
              className="flex w-full items-center justify-center gap-3.5 rounded-lg bg-graydark py-3 px-6 text-sm font-medium text-white hover:bg-opacity-90"
            >
              <FiChevronLeft size={16} />
              Regresar
            </button>
          </div>
        </nav>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;