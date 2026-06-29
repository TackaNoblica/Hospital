import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage             from './pages/LoginPage';
import DashboardPage         from './pages/DashboardPage';
import PatientsPage          from './pages/PatientsPage';
import PatientDetailPage     from './pages/PatientDetailPage';
import PatientPage           from './pages/PatientPage.jsx';
import DischargePlanPage     from './pages/DischargePlanPage';
import NotificationsPage     from './pages/NotificationsPage.jsx';
import FamilyDashboard       from './pages/FamilyDashboard';
import DoctorRequestsPage    from './pages/DoctorRequestsPage';
import PatientFindDoctorPage from './pages/PatientFindDoctorPage';
import ChatPage              from './pages/ChatPage';
import PatientHealthPage     from './pages/PatientHealthPage';
import DrMegiPage            from './pages/DrMegiPage';
import InstitutionDashboard  from './pages/InstitutionDashboard';
import ChatBot               from './components/ChatBot';

function RequireAuth({ children }) {
  const token = localStorage.getItem('careafterToken');
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"                 element={<LoginPage />} />
        <Route path="/dashboard"        element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/patients"         element={<RequireAuth><PatientsPage /></RequireAuth>} />
        <Route path="/patients/:id"     element={<RequireAuth><PatientDetailPage /></RequireAuth>} />
        <Route path="/patient"          element={<RequireAuth><PatientPage /></RequireAuth>} />
        <Route path="/plan"             element={<RequireAuth><DischargePlanPage /></RequireAuth>} />
        <Route path="/notifications"    element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/family"           element={<RequireAuth><FamilyDashboard /></RequireAuth>} />
        <Route path="/doctor-requests"  element={<RequireAuth><DoctorRequestsPage /></RequireAuth>} />
        <Route path="/my-doctors"       element={<RequireAuth><PatientFindDoctorPage /></RequireAuth>} />
        <Route path="/chat"             element={<RequireAuth><ChatPage /></RequireAuth>} />
        <Route path="/health"           element={<RequireAuth><PatientHealthPage /></RequireAuth>} />
        <Route path="/dr-megi"          element={<RequireAuth><DrMegiPage /></RequireAuth>} />
        <Route path="/institution"      element={<RequireAuth><InstitutionDashboard /></RequireAuth>} />
        <Route path="*"                 element={<Navigate to="/" replace />} />
      </Routes>
      <ChatBot />
    </Router>
  );
}
