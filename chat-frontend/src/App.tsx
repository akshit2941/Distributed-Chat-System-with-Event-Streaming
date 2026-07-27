import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginRegister } from './components/LoginRegister';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}>
        <h2>Loading Session...</h2>
      </div>
    );
  }

  return token ? <Dashboard /> : <LoginRegister />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
