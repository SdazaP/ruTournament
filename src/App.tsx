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
import ResultsRB from './pages/Tournament/ResultsRB';
import ResultsViewRB from './pages/Tournament/Results/ResultsViewRB';
import ResultsViewWCA from './pages/Tournament/Results/ResultsViewWCA';
import HomePage from './pages/HomePage';

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
              </Routes>
            </DashboardLayout>
          </>
        }
      />
      
      <Route
        path='/'
        element={
          <>
            <PageTitle title='ruTournament'/>
            <HomePage/>
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
                      <PageTitle title="Tournament Competitors" />
                      <Participants />
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
                  path='results/WCA'
                  element={
                    <>
                      <PageTitle title="WCA Results" />
                      <ResultsWCA />
                    </>
                  }
                />
                <Route
                  path='results/RB'
                  element={
                    <>
                      <PageTitle title="Red Bull Results" />
                      <ResultsRB />
                    </>
                  }
                />
                <Route
                  path='view/resultsRB'
                  element={
                    <>
                      <PageTitle title="View Red Bull Results" />
                      <ResultsViewRB />
                    </>
                  }
                />
                <Route
                  path='view/resultsWCA'
                  element={
                    <>
                      <PageTitle title="View WCA Results" />
                      <ResultsViewWCA />
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
  );
}

export default App;