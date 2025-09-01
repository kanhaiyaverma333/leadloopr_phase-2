import { motion } from 'framer-motion';
import { Button } from "@/components/marketing/components/ui/button";

interface Feature1Props {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  buttonPrimary: {
    label: string;
    href: string;
  };
  buttonSecondary: {
    label: string;
    href: string;
  };
}

const Feature1 = ({
  title,
  description,
  imageSrc,
  imageAlt,
  buttonPrimary,
  buttonSecondary,
}: Feature1Props) => {
  // Check if the source is a video based on file extension
  const isVideo = imageSrc.match(/\.(mp4|webm|ogg|mov)$/i);

  const MediaElement = () => {
    if (isVideo) {
      return (
        <video
          src={imageSrc}
          className="w-full h-80 lg:h-96 rounded-2xl object-cover"
          controls
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={imageSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }

    return (
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-full h-80 lg:h-96 rounded-2xl object-cover"
      />
    );
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center lg:items-start lg:text-left"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              {title}
            </h2>
            <p className="mb-8 max-w-xl text-muted-foreground text-lg leading-relaxed">
              {description}
            </p>
            <div className="flex w-full flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <a href={buttonPrimary.href} target="_blank">
                    {buttonPrimary.label}
                  </a>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                  <a href={buttonSecondary.href} target="_blank">
                    {buttonSecondary.label}
                  </a>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass-card p-2 rounded-3xl">
              <MediaElement />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export { Feature1 };