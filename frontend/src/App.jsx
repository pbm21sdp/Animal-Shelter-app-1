import FloatingPaw from "./components/FloatingPaw";
import { Route, Routes } from "react-router-dom";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";

function App() {
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
                <Route path='/' element={<HomePage />} />
                <Route path='/signup' element={<SignUpPage />} />
                <Route path='/login' element={<LoginPage />} />
            </Routes>

        </div>
    );
}

export default App;