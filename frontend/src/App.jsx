import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useState, useContext, useEffect } from 'react';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Questions from './pages/Questions';
import QuestionDetail from './pages/QuestionDetail';
import MockInterview from './pages/MockInterview';
import Analytics from './pages/Analytics';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import AdminPanel from './pages/AdminPanel';
import AIQuestionGenerator from './pages/AIQuestionGenerator';
import AIChatbot from './pages/AIChatbot';
import ErrorDetector from './pages/ErrorDetector';
import Gamification from './pages/Gamification';
import Navbar from './components/Navbar';
import { AuthContext } from './context/AuthContext';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { loading } = useContext(AuthContext);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Navbar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className={`transition-all duration-300 ${!isMobile ? 'lg:pl-[280px]' : ''}`}>
        <div className="pt-16 sm:pt-20 px-4 sm:px-6 lg:px-8 pb-8">
          <Routes>
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/questions" element={
              <PrivateRoute>
                <Questions />
              </PrivateRoute>
            } />
            
            <Route path="/questions/:id" element={
              <PrivateRoute>
                <QuestionDetail />
              </PrivateRoute>
            } />
            
            <Route path="/mock-interview" element={
              <PrivateRoute>
                <MockInterview />
              </PrivateRoute>
            } />
            
            <Route path="/analytics" element={
              <PrivateRoute>
                <Analytics />
              </PrivateRoute>
            } />
            
            <Route path="/resume" element={
              <PrivateRoute>
                <ResumeAnalyzer />
              </PrivateRoute>
            } />
            
            <Route path="/ai-questions" element={
              <PrivateRoute>
                <AIQuestionGenerator />
              </PrivateRoute>
            } />
           
            <Route path="/chatbot" element={
              <PrivateRoute>
                <AIChatbot />
              </PrivateRoute>
            } />

            <Route path="/error-detector" element={
              <PrivateRoute>
                <ErrorDetector />
              </PrivateRoute>
            } />

            <Route path="/achievements" element={
              <PrivateRoute>
                <Gamification />
              </PrivateRoute>
            } />
            
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
