import { motion } from "framer-motion";

const RevealSection = ({ children, className = "", delayMs = 0 }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.55, delay: delayMs / 1000, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default RevealSection;
