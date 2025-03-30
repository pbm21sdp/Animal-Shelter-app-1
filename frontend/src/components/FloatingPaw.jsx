import { motion } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw } from '@fortawesome/free-solid-svg-icons';

const FloatingPaw = ({ size, top, left, delay }) => {
    return (
        <motion.div
            className="absolute text-amber-700 opacity-20 blur-sm"
            style={{
                top,
                left,
                width: size,
                height: size
            }}
            animate={{
                y: ["0%", "10%", "0%"],
                rotate: [0, 3, 0],
                opacity: [0.15, 0.25, 0.15]
            }}
            transition={{
                duration: 8,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
                delay
            }}
            aria-hidden='true'
        >
            <FontAwesomeIcon
                icon={faPaw}
                className="w-full h-full"
                style={{
                    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.05))"
                }}
            />
        </motion.div>
    )
}

export default FloatingPaw;