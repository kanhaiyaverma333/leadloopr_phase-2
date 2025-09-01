import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/marketing/components/ui/button';

const CTA = () => {
  return (
    <div className="relative w-full py-12 md:py-16 overflow-hidden">
      {/* Background Image - same as Hero */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/marketing/assets/hero-bg.jpg)`
        }}
      />

      {/* Gradient Overlays - same as Hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/20" />

      {/* Glass overlay for consistency with other sections */}
      <div className="absolute inset-0 bg-white/[0.02]" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-white text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
        >
          Ready to boost your ad performance by{' '}
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            30%?
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-white/80 mx-auto mt-3 max-w-2xl text-lg"
        >
          Join other high-growth teams using Leadloopr to turn offline wins into optimization signals for better leads and bigger returns.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex justify-center mt-8"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-90 transition-all duration-300 group glow text-lg px-8 py-4 rounded-2xl glass-card border border-white/20"
            >
              Start My Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CTA;