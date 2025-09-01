import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useEffect } from 'react';

const Testimonials = () => {
  useEffect(() => {
    // Load Senja widget script
    const script = document.createElement('script');
    script.src = 'https://widget.senja.io/widget/e63ff8f3-73f2-43ba-a04a-18ae85163e34/platform.js';
    script.type = 'text/javascript';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector('script[src*="senja.io"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-secondary opacity-10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
          >
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Customer Stories</span>
          </motion.div>

          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Proof beats{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              promises
            </span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We could tell you how Leadloopr transforms your ad performance, but it's better when our users do.
          </p>
        </motion.div>

        {/* Senja Widget */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <div
            className="senja-embed"
            data-id="e63ff8f3-73f2-43ba-a04a-18ae85163e34"
            data-mode="shadow"
            data-lazyload="false"
            style={{ display: 'block', width: '100%' }}
          />
        </motion.div>

      </div>
    </section>
  );
};

export default Testimonials;