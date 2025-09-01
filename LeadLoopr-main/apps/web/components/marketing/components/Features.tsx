import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Feature1 } from './features/Feature1';
import { Feature2 } from './features/Feature2';

// Import feature images
// Removed unused static image imports; using video/image sources via public paths instead

const Features = () => {
  const featuresData = [
    {
      title: 'Smarter Ads',
      description: 'When your campaigns know which leads turn into customers, everything improves. Cost-per-lead drops. Lead quality rises. You stop scaling noise and start scaling results because the algorithm finally knows what "good" looks like.',
      imageSrc: '/marketing/assets/video/Pitch-demo.mp4',
      imageAlt: 'Pitch demo video',
      buttonPrimary: { label: 'Boost Campaigns', href: '#' },
      buttonSecondary: { label: 'Learn More', href: '#' },
    },
    {
      title: 'Visual Pipeline',
      description: 'Effortlessly track every lead from the first click to a closed deal, all within one intuitive drag-and-drop board. Customize your sales stages to fit your exact flow, whether that\'s Discovery Call, Proposal Sent, or Contract Signed.',
      imageSrc: '/marketing/assets/video/Notion-demo.mp4',
      imageAlt: 'Notion demo video',
      buttonPrimary: { label: 'Build Pipeline', href: '#' },
      buttonSecondary: { label: 'See Demo', href: '#' },
    },
    {
      title: 'One-Click Sync',
      description: 'Mark leads as Qualified, Won, or Lost and Leadloopr instantly syncs that data back to your ad platforms. This feedback supercharges campaign optimization, so the algorithm starts chasing your best leads instead of just clicks.',
      imageSrc: '/marketing/assets/video/Framer-demo.mp4',
      imageAlt: 'Framer demo video',
      buttonPrimary: { label: 'Connect Ad Accounts', href: '#' },
      buttonSecondary: { label: 'View Pricing', href: '#' },
    },
    {
      title: 'Set Up in Minutes',
      description: 'Leadloopr integrates seamlessly via Google Tag Manager no code edits, no engineering help. Setup takes less than 5 minutes and includes a step-by-step guide. You\'ll be feeding real conversion data back to your ad platforms by lunch.',
      imageSrc: '/marketing/assets/video/Github-demo.mp4',
      imageAlt: 'Github demo video',
      buttonPrimary: { label: 'Install with GTM', href: '#' },
      buttonSecondary: { label: 'View Setup Guide', href: '#' },
    },
    {
      title: 'All in One Tool',
      description: 'Why pay for a bloated CRM and a separate conversion API tool? Leadloopr handles both. Manage your leads and sync them to ad platforms in one streamlined workflow, saving time, reducing cost, and eliminating tool fatigue',
      imageSrc: '/marketing/assets/video/Levelsio-demo.mp4',
      imageAlt: 'Levelsio demo video',
      buttonPrimary: { label: 'Compare Plans', href: '#' },
      buttonSecondary: {
        label: 'Watch Integration', href: '#'
      },
    },
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Core Features</span>
          </motion.div>
        </motion.div>

        {/* Feature Blocks */}
        <div className="space-y-0">
          {featuresData.map((feature, index) => {
            const isEven = index % 2 === 0;
            const FeatureComponent = isEven ? Feature1 : Feature2;

            return (
              <FeatureComponent
                key={feature.title}
                title={feature.title}
                description={feature.description}
                imageSrc={feature.imageSrc}
                imageAlt={feature.imageAlt}
                buttonPrimary={feature.buttonPrimary}
                buttonSecondary={feature.buttonSecondary}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;