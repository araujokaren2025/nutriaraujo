import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientsList from './pages/PatientsList';
import PatientNew from './pages/PatientNew';
import PatientProfile from './pages/PatientProfile';
import Layout from './components/Layout';

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="pacientes" element={<PatientsList />} />
        <Route path="pacientes/novo" element={<PatientNew />} />
        <Route path="pacientes/:id" element={<PatientProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
