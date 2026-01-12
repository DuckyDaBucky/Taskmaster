import { motion, type Variants, type Transition } from "framer-motion";

const squareTransition: Transition = {
  duration: 6,
  repeat: Infinity,
  repeatType: "loop",
  ease: "easeInOut",
};

const squareVariants: Variants = {
  hidden: { opacity: 0 },
  float: {
    opacity: [0, 0.08, 0],
    transition: squareTransition,
  },
};

const generateSquares = (count: number) => {
  const squares = [];

  // Subtle, desaturated colors with reduced opacity
  const colorClasses = [
    "bg-pink-300/60",
    "bg-blue-300/60",
    "bg-purple-300/60",
    "bg-indigo-300/60",
    "bg-violet-300/60",
    "bg-rose-300/60",
    "bg-teal-300/60",
    "bg-cyan-300/60",
    "bg-fuchsia-300/60",
    "bg-sky-300/60",
    "bg-blue-300/60",
    "bg-indigo-300/60",
    "bg-violet-300/60",
    "bg-purple-300/60",
  ];

  for (let i = 0; i < count; i++) {
    const top = Math.random() * 90;
    const left = Math.random() * 90;
    const size = Math.floor(Math.random() * 104) + 130; // 130–234px
    const delay = Math.random() * 4;

    squares.push(
      <motion.div
        key={i}
        variants={squareVariants}
        initial="hidden"
        animate="float"
        transition={{ delay }}
        className={`absolute ${colorClasses[i % colorClasses.length]} rounded-xl`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          top: `${top}%`,
          left: `${left}%`,
        }}
      />
    );
  }

  return squares;
};

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: "#F3F4FB" }}
      />

      {/* 14 colorful, gently fading floating squares */}
      {generateSquares(14)}
    </div>
  );
};

export default AnimatedBackground;
