import { motion } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw } from '@fortawesome/free-solid-svg-icons';

const FloatingPaw = ({ size, top, left, delay }) => {
    return (
        <motion.div
            className="absolute text-amber-700 opacity-20"
            style={{
                top,
                left,
                width: size,
                height: size,
                willChange: "transform, opacity",
                filter: "blur(4px)", // Minimal blur (1-4px is optimal)
            }}
            initial={{ y: 0, opacity: 0.15 }}
            animate={{
                y: 10,
                opacity: 0.25,
            }}
            transition={{
                duration: 12,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse",
                delay,
            }}
            aria-hidden="true"
        >
            <FontAwesomeIcon icon={faPaw} className="w-full h-full" />
        </motion.div>
    );
};

export default FloatingPaw;