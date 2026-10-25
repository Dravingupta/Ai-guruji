import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { saveProfile } from './services/backendService';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ProfileForm from './components/ProfileForm';
import { RefreshCw } from 'lucide-react';

const HowItWorks = React.lazy(() => import('./components/HowItWorks'));

const LoadingScreen = () => (
    <div className="app-loading">
        <div>
            <RefreshCw className="spin" size={26} />
            <p>Finding your momentum…</p>
        </div>
    </div>
);

const ProtectedRoute = ({ children, requireProfile = true }) => {
    const { user, userProfile, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (requireProfile && !userProfile) {
        return <Navigate to="/profile" replace />;
    }

    return children;
};

const PublicOnlyRoute = ({ children }) => {
    const { user, userProfile, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    if (user) {
        if (userProfile) {
            return <Navigate to="/dashboard" replace />;
        } else {
            return <Navigate to="/profile" replace />;
        }
    }

    return children;
};

const DashboardWrapper = () => {
    const { userProfile, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const section = location.pathname === '/profile' ? 'profile' : location.pathname === '/progress' ? 'progress' : location.state?.section || 'overview';

    return (
        <Dashboard
            key={userProfile.uid}
            user={userProfile}
            onLogout={logout}
            initialSection={section}
            onViewProfile={() => navigate('/profile')}
            onEditProfile={() => navigate('/profile/edit')}
            onSectionChange={next => navigate(next === 'profile' ? '/profile' : next === 'progress' ? '/progress' : '/dashboard', { state: { section: next } })}
            theme={theme}
            onToggleTheme={toggleTheme}
        />
    );
};

const ProfileFormWrapper = () => {
    const { user, userProfile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [saving, setSaving] = React.useState(false);
    const [saveError, setSaveError] = React.useState('');

    const handleSave = async (profileData) => {
        setSaving(true);
        setSaveError('');
        try {
            await saveProfile(profileData);
            await refreshProfile();
            navigate(userProfile ? '/profile' : '/dashboard');
        } catch (error) {
            console.error("Failed to save profile:", error);
            setSaveError('Your changes couldn’t be saved. Check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ProfileForm
            uid={user?.uid}
            email={user?.email}
            displayName={user?.displayName}
            initialData={userProfile}
            mode={userProfile ? 'edit' : 'create'}
            onSave={handleSave}
            saving={saving}
            saveError={saveError}
            onCancel={() => navigate('/profile')}
        />
    );
};

const ProfileRoute = () => {
    const { userProfile } = useAuth();
    return userProfile ? <DashboardWrapper /> : <ProfileFormWrapper />;
};

const AppRouter = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={
                    <PublicOnlyRoute>
                        <LandingPage
                            onGoogleLogin={() => window.location.href = '/auth'}
                            onEmailLoginClick={() => window.location.href = '/auth'}
                        />
                    </PublicOnlyRoute>
                } />

                <Route path="/how-it-works" element={<React.Suspense fallback={<LoadingScreen />}><HowItWorks /></React.Suspense>} />

                <Route path="/auth" element={
                    <PublicOnlyRoute>
                        <Auth />
                    </PublicOnlyRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute requireProfile={false}>
                        <ProfileRoute />
                    </ProtectedRoute>
                } />

                <Route path="/profile/edit" element={
                    <ProtectedRoute>
                        <ProfileFormWrapper />
                    </ProtectedRoute>
                } />

                <Route path="/progress" element={<ProtectedRoute><DashboardWrapper /></ProtectedRoute>} />

                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardWrapper />
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;
