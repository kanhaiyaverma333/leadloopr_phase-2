import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/marketing/components/ui/button';
import { useRef } from 'react';

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with Parallax */}
      <motion.div
        style={{
          y,
          scale,
          backgroundImage: `url(/marketing/assets/hero-bg.jpg)`
        }}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/20" />

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Content Card */}
          <div className="glass-card rounded-3xl p-8 md:p-12 border border-white/5 dark:border-white/5 bg-white/1 dark:bg-white/1">
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight break-words"
              style={{ letterSpacing: '-0.05em' }}
            >
              Increase your ad performance by{' '}
              <span className="italic bg-gradient-primary bg-clip-text text-transparent">
                30%
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-base md:text-lg text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Turn your offline wins into optimization signals, so you get better leads and bigger returns.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-primary hover:opacity-90 transition-all duration-300 group glow text-lg px-8 py-4 rounded-2xl glass-card border border-white/20"
                >
                  Increase performance
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Secondary CTA - Pill Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="inline-block"
            >
              <div className="px-4 py-2 rounded-full glass-card border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/5 backdrop-blur-md">
                <span className="text-[10px] font-medium text-foreground/80">
                  Connect in 5 minutes
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Ambient Light Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"
        />
      </div>
    </section>
  );
};

export default Hero;