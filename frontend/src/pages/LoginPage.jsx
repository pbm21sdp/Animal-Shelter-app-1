import {useState} from "react";
import {motion} from "framer-motion";
import {User, Loader, Lock, Mail} from "lucide-react";
import {Link} from "react-router-dom";
import Input from "../components/Input.jsx";
import {useAuthStore} from "../store/authStore";

const LoginPage = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { login, isLoading, error } = useAuthStore();


    const handleLogin = async (e) => {
        e.preventDefault();
        await login(email, password);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='max-w-md w-full bg-white bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
        >
            <div className='p-8'>
                <h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-violet-400 to-purple-500 text-transparent bg-clip-text'>
                    Welcome Back
                </h2>

                <form onSubmit={handleLogin}>
                    <Input
                        icon={Mail}
                        type='email'
                        placeholder='Email Address'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Input
                        icon={Lock}
                        type='password'
                        placeholder='Password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <div className={"flex items-center mb-6"}>
                        <Link to="/forgot-password" className="text-violet-400 hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    {error && <p className="text-red-500 font-semibold mb-2">{error}</p>}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className='w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold
                         rounded-lg shadow-lg hover:from-violet-600 hover:to-purple-700 focus:outline-none focus:ring-2
                          focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-purple-800 transition duration-200'
                        type='submit'
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader className='w-6 h-6 animate-spin mx-auto' /> : "Login"}
                    </motion.button>
                </form>
            </div>

            <div className='px-8 py-4 bg-gray-300 bg-opacity-50 flex justify-center'>
                <p className='text-sm text-gray-500'>
                    Don't have an account?{" "}
                    <Link to='/signup' className='text-violet-400 hover:underline'>
                        Sign up
                    </Link>
                </p>
            </div>

        </motion.div>
    );
};
export default LoginPage;