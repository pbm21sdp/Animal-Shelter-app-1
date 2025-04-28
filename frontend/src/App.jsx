import FloatingPaw from "./components/FloatingPaw";
import {Navigate, Route, Routes} from "react-router-dom";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import PawsHomePage from "./pages/PawsHomePage"
import PetSearchPage from "./pages/PetSearchPage"; // NEW
import PetDetailPage from "./pages/PetDetailPage"; // NEW
import AdminDashboardPage from "./pages/AdminDashboardPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import {Toaster} from "react-hot-toast";
import {useAuthStore} from "./store/authStore";
import {useEffect} from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

//protect routes that require authentication
const ProtectedRoute = ({children}) => {
    const {isAuthenticated, user} = useAuthStore();
    if (!isAuthenticated){
        return <Navigate to="/login" replace />
    }

    if (!user.isVerified){
        return <Navigate to="/verify-email" replace />
    }

    return children;
}


// redirect authenticated user to the home page
const RedirectAuthenticatedUser = ({children}) => {
    const {isAuthenticated, user} = useAuthStore();

    if (isAuthenticated && user.isVerified){
        return <Navigate to="/" replace />
    }

    return children;
}

function App() {
    const {isCheckingAuth, checkAuth, isAuthenticated, user} = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isCheckingAuth) return <LoadingSpinner />;

    console.log("isAuthenticated",isAuthenticated);
    console.log("user", user);

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-sky-50 flex items-center justify-center relative
        overflow-hidden">

            <FloatingPaw size="w-64 h-64" top="-15%" left="25%" delay={0}/>
            <FloatingPaw size="w-48 h-48" top="75%" left="85%" delay={1.5}/>
            <FloatingPaw size="w-32 h-32" top="30%" left="8%" delay={2.2}/>
            <FloatingPaw size="w-64 h-64" top="0%" left="70%" delay={3}/>
            <FloatingPaw size="w-32 h-32" top="45%" left="50%" delay={4}/>
            <FloatingPaw size="w-32 h-32" top="80%" left="30%" delay={1}/>

            <Routes>
                <Route path='/' element={
                    <ProtectedRoute>
                        <PawsHomePage />
                    </ProtectedRoute>
                }
                />
                <Route path='/pet-search' element={
                    <ProtectedRoute>
                        <PetSearchPage />
                    </ProtectedRoute>
                }
                />
                <Route path='/pet/:id' element={
                    <ProtectedRoute>
                        <PetDetailPage />
                    </ProtectedRoute>
                }
                />
                <Route path='/signup' element={
                    <RedirectAuthenticatedUser>
                        <SignUpPage />
                    </RedirectAuthenticatedUser>
                }
                />
                <Route path='/login' element={
                    <RedirectAuthenticatedUser>
                        <LoginPage />
                    </RedirectAuthenticatedUser>
                }
                />
                <Route path='/verify-email' element={<EmailVerificationPage />}/>
                <Route path='/forgot-password' element={
                    <RedirectAuthenticatedUser>
                        <ForgotPasswordPage />
                    </RedirectAuthenticatedUser>
                }
                />
                <Route
                    path='/reset-password/:token'
                    element={
                        <RedirectAuthenticatedUser>
                            <ResetPasswordPage />
                        </RedirectAuthenticatedUser>
                    }
                />

                <Route path='/admin/pets' element={
                    <ProtectedRoute>
                        <AdminDashboardPage />
                    </ProtectedRoute>
                }
                />

                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
            <Toaster/>

        </div>
    );
}

export default App;