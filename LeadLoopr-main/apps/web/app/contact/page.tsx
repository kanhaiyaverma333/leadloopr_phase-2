"use client";
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

const Contact = () => {
    const router = useRouter();

    const contactInfo = [
        {
            icon: Mail,
            title: 'Email',
            content: 'hello@leadloopr.com',
            href: 'mailto:hello@leadloopr.com'
        },
        {
            icon: Phone,
            title: 'Phone',
            content: '+1 (555) 123-4567',
            href: 'tel:+15551234567'
        },
        {
            icon: MapPin,
            title: 'Office',
            content: 'San Francisco, CA',
            href: '#'
        }
    ];

    return (
        <div className="min-h-screen font-inter bg-gradient-to-br from-background via-background to-background/50">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 40,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-primary opacity-5 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [360, 0],
                    }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-secondary opacity-5 rounded-full blur-3xl"
                />
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="glass-card hover:glow group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Button>
                </motion.div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                        Get in{' '}
                        <span className="bg-gradient-primary bg-clip-text text-transparent">
                            Touch
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Have a question or want to learn more about Leadloopr? We'd love to hear from you.
                        Send us a message and we'll respond as soon as possible.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="glass-card p-8 rounded-3xl"
                    >
                        <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                        <form className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                                        First Name
                                    </label>
                                    <Input
                                        id="firstName"
                                        placeholder="John"
                                        className="glass-card border-glass-border"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                                        Last Name
                                    </label>
                                    <Input
                                        id="lastName"
                                        placeholder="Doe"
                                        className="glass-card border-glass-border"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-2">
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    className="glass-card border-glass-border"
                                />
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                                    Subject
                                </label>
                                <Input
                                    id="subject"
                                    placeholder="How can we help?"
                                    className="glass-card border-glass-border"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium mb-2">
                                    Message
                                </label>
                                <Textarea
                                    id="message"
                                    placeholder="Tell us more about your inquiry..."
                                    rows={6}
                                    className="glass-card border-glass-border resize-none"
                                />
                            </div>

                            <Button className="w-full bg-gradient-primary hover:opacity-90 glow">
                                <Send className="w-4 h-4 mr-2" />
                                Send Message
                            </Button>
                        </form>
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="space-y-8"
                    >
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                            <p className="text-muted-foreground mb-8">
                                Ready to start building amazing applications? Reach out to us through any of these channels.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {contactInfo.map((info, index) => (
                                <motion.a
                                    key={info.title}
                                    href={info.href}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                                    className="glass-card p-6 rounded-2xl hover:glow transition-all duration-300 group block"
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 glass-card rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <info.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">{info.title}</h3>
                                            <p className="text-muted-foreground">{info.content}</p>
                                        </div>
                                    </div>
                                </motion.a>
                            ))}
                        </div>

                        {/* Office Hours */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.9 }}
                            className="glass-card p-6 rounded-2xl"
                        >
                            <h3 className="font-semibold mb-4">Office Hours</h3>
                            <div className="space-y-2 text-muted-foreground">
                                <p>Monday - Friday: 9:00 AM - 6:00 PM PST</p>
                                <p>Saturday: 10:00 AM - 4:00 PM PST</p>
                                <p>Sunday: Closed</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Contact; 