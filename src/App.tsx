import QueryMonitor from './components/QueryMonitor';
import TestQueryPage from './components/TestQueryPage';
import AuthPage from './components/QueryMonitor/AuthPage';
import AuthCallback from './components/QueryMonitor/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import { Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div>
      <Routes>
        {/* Auth routes */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/github/callback" element={<AuthCallback />} />
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <QueryMonitor />
          </ProtectedRoute>
        } />
        <Route path='/test-query' element={
          <ProtectedRoute>
            <TestQueryPage />
          </ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;
