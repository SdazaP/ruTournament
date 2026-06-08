import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import ScrollToTop from './components/ScrollToTop';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import TournamentCreation from './pages/NewTournament/TournamentCreation';
import DashboardLayout from './layout/DashboardLayout';
import DashboardTournament from './layout/DashboardTournament';
import Tournaments from './pages/Dashboard/Tournaments';
import WelcomePage from './pages/Dashboard/WelcomePage';
import Guide from './pages/Dashboard/Guide';
import TournamentWelcome from './pages/Tournament/TournamentWelcome';
import Participants from './pages/Tournament/Participants';
import Staffing from './pages/Tournament/Staffing';
import Groups from './pages/Tournament/Groups';
import Categories from './pages/Tournament/Categories';
import Scrambles from './pages/Tournament/Scrambles';
import Results from './pages/Tournament/Results';
import ResultsView from './pages/Tournament/ResultsView';
import Schedule from './pages/Tournament/Schedule';
import HomePage from './pages/HomePage';

function App() {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <>
      <ScrollToTop />
      <Routes>
        {/* DashboardLayout */}
        <Route
          path="/dashboard/*"
          element={
            <>
              <PageTitle title="Dashboard Tournaments" />
              <DashboardLayout>
                <Routes>
                  <Route
                    index
                    element={
                      <>
                        <PageTitle title="Dashboard Tournaments" />
                        <WelcomePage />
                      </>
                    }
                  />
                  <Route
                    path="tournaments"
                    element={
                      <>
                        <PageTitle title="Tournaments" />
                        <Tournaments />
                      </>
                    }
                  />
                  <Route
                    path="new-tournament"
                    element={
                      <>
                        <PageTitle title="Tournament Creation" />
                        <TournamentCreation />
                      </>
                    }
                  />
                  <Route
                    path="guide"
                    element={
                      <>
                        <PageTitle title="Guía de Uso" />
                        <Guide />
                      </>
                    }
                  />
                </Routes>
              </DashboardLayout>
            </>
          }
        />

        <Route
          path='/'
          element={
            <>
              <PageTitle title='ruTournament' />
              <HomePage />
            </>
          }
        />

        {/* Rutas de torneos específicos */}
        <Route
          path="/dashboard/tournament/:id/*"
          element={
            <>
              <PageTitle title="Tournament Details" />
              <DashboardTournament>
                <Routes>
                  <Route
                    index
                    element={
                      <>
                        <PageTitle title="Tournament Overview" />
                        <TournamentWelcome />
                      </>
                    }
                  />
                  <Route
                    path='competitors'
                    element={
                      <>
                        <PageTitle title="Tournament Participants" />
                        <Participants />
                      </>
                    }
                  />
                  <Route
                    path='staffing'
                    element={
                      <>
                        <PageTitle title="Tournament Staffing" />
                        <Staffing />
                      </>
                    }
                  />
                  <Route
                    path='groups'
                    element={
                      <>
                        <PageTitle title="Tournament Groups" />
                        <Groups />
                      </>
                    }
                  />
                  <Route
                    path='categories'
                    element={
                      <>
                        <PageTitle title="Tournament Categories" />
                        <Categories />
                      </>
                    }
                  />
                  <Route
                    path='schedule'
                    element={
                      <>
                        <PageTitle title="Cronograma | ruTournament" />
                        <Schedule />
                      </>
                    }
                  />
                  <Route
                    path='scrambles'
                    element={
                      <>
                        <PageTitle title="Official Scrambles" />
                        <Scrambles />
                      </>
                    }
                  />
                  <Route
                    path='results'
                    element={
                      <>
                        <PageTitle title="Gestionar Resultados | ruTournament" />
                        <Results />
                      </>
                    }
                  />
                  <Route
                    path='view/results'
                    element={
                      <>
                        <PageTitle title="Ver Resultados | ruTournament" />
                        <ResultsView />
                      </>
                    }
                  />
                </Routes>
              </DashboardTournament>
            </>
          }
        />

        {/* Rutas de autenticación */}
        <Route
          path="/auth/signin"
          element={
            <>
              <PageTitle title="Signin" />
              <SignIn />
            </>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <>
              <PageTitle title="Signup" />
              <SignUp />
            </>
          }
        />
      </Routes>
    </>
  );
}

export default App;