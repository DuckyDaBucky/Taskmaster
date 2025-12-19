import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const Greeting = () => {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hours = new Date().getHours();
    let greetingMessage = "";

    if (hours < 12) greetingMessage = "Good Morning";
    else if (hours < 18) greetingMessage = "Good Afternoon";
    else greetingMessage = "Good Evening";

    setGreeting(`${greetingMessage} User! :D`);
  }, []);

  return (
    <motion.div
      className="whitespace-nowrap text-gray-700 font-medium text-sm sm:text-base"
      animate={{ x: ["-100%", "100%"] }} 
      transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
    >
      {greeting}
    </motion.div>
  );
};

export default Greeting;
