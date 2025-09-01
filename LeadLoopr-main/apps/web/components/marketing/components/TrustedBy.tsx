import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import Marquee from "@/components/marketing/components/magicui/marquee";

const companies = [
  { name: 'Vkom', logo: '/images/vkom-logo-zwart-1.png' },
  { name: 'OpenAI', logo: '⚫' },
  { name: 'GitHub', logo: '🐙' },
  { name: 'Vercel', logo: '▲' },
  { name: 'Linear', logo: '📐' },
  { name: 'Figma', logo: '🎨' },
  { name: 'Notion', logo: '📝' },
  { name: 'Discord', logo: '🎮' },
  { name: 'Slack', logo: '💬' },
  { name: 'Stripe', logo: '💳' },
  { name: 'Shopify', logo: '🛍️' },
  { name: 'Netflix', logo: '🎬' },
];

const CompanyCard = ({
  logo,
  name,
}: {
  logo: string;
  name: string;
}) => {
  return (
    <div
      className={cn(
        "relative h-full w-32 cursor-pointer overflow-hidden rounded-xl border p-4 mx-3 transition-all duration-300",
        // light styles
        "border-glass-border/50 bg-glass/50 hover:bg-glass/80 hover:scale-105 backdrop-blur-md",
        // dark styles
        "dark:border-glass-border/30 dark:bg-glass/30 dark:hover:bg-glass/50",
      )}
    >
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-2">
          {logo.startsWith('/') ? (
            <img
              src={logo}
              alt={name}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-2xl">{logo}</span>
          )}
        </div>
        <p className="text-xs font-medium text-muted-foreground text-center">{name}</p>
      </div>
    </div>
  );
};

const TrustedBy = () => {
  return (
    <section className="pt-16 pb-6">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground text-lg mb-8">
            Trusted by marketers at world-class companies
          </p>
        </motion.div>

        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <Marquee pauseOnHover className="[--duration:30s]">
            {companies.map((company) => (
              <CompanyCard key={company.name} {...company} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background to-transparent"></div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;