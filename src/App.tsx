import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import TournamentCreation from './pages/NewTournament/TournamentCreation';
import DashboardLayout from './layout/DashboardLayout';
import DashboardTournament from './layout/DashboardTournament';
import Tournaments from './pages/Dashboard/Tournaments';
import WelcomePage from './pages/Dashboard/WelcomePage';
import TournamentWelcome from './pages/Tournament/TournamentWelcome';
import Participants from './pages/Tournament/Participants';
import Categories from './pages/Tournament/Categories';
import ResultsWCA from './pages/Tournament/ResultsWCA';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <Routes>
      {/* DashboardLayout */}
      <Route
        path="/dashboard/*"
        element={
          <>
            <PageTitle title="Dashboard Tournamenmts" />
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
                  index
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
              </Routes>
            </DashboardLayout>
          </>
        }
      />
      <Route
        path="/dashboard/tournament/*"
        element={
          <>
            <PageTitle title="Dashboard Tournamenmt" />
            <DashboardTournament>
              <Routes>
                <Route
                  index
                  element={
                    <>
                      <PageTitle title="Dashboard Tournament" />
                      <TournamentWelcome />
                    </>
                  }
                />
                <Route
                  path='competitors'
                  element={
                    <>
                      <PageTitle title="Competitors Tournament" />
                      <Participants />
                    </>
                  }
                />
                <Route
                  path='categories'
                  element={
                    <>
                      <PageTitle title="Competitors Tournament" />
                      <Categories />
                    </>
                  }
                />
                <Route
                  path='results/categorie1'
                  element={
                    <>
                      <PageTitle title="Competitors Tournament" />
                      <ResultsWCA />
                    </>
                  }
                />
              </Routes>
            </DashboardTournament>
          </>
        }
      />

      {/* Rutas fuera del DefaultLayout */}

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
  );
}

export default App;
