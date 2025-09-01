"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/marketing/components/ui/button";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // next-themes: use resolvedTheme for correct behavior in "system"
  const { resolvedTheme, setTheme } = useTheme();

  // avoid SSR hydration mismatch (theme is undefined on first render)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    // optional: render a minimal shell to avoid layout shift
    return null;
  }

  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const menuItems = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Documentation", href: "#about" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-4 left-4 right-4 z-50 glass-card border border-glass-border/50 rounded-2xl"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="relative">
                <Sparkles className="w-8 h-8 text-primary animate-glow" />
                <div className="absolute inset-0 w-8 h-8 bg-primary/20 rounded-full blur-lg animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Leadloopr
              </span>
            </motion.div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-8">
              {menuItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="text-muted-foreground hover:text-primary transition-colors duration-300 relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all duration-300 group-hover:w-full" />
                </motion.a>
              ))}
            </nav>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center space-x-4">
              <SignedOut>
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
                  <Link href="/auth/sign-in">Sign In</Link>
                </Button>
                <Button asChild className="bg-gradient-primary hover:opacity-90 transition-opacity glow">
                  <Link href="/auth/sign-up">Get Started</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button asChild className="bg-gradient-primary hover:opacity-90 transition-opacity glow">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>

              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:glow-secondary transition-all duration-300">
                {isDark ? <Sun className="h-5 w-5 text-secondary" /> : <Moon className="h-5 w-5 text-secondary" />}
              </Button>
            </div>

            {/* Mobile controls */}
            <div className="md:hidden flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:glow-secondary transition-all duration-300">
                {isDark ? <Sun className="h-5 w-5 text-secondary" /> : <Moon className="h-5 w-5 text-secondary" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-20 left-0 right-0 z-40 md:hidden glass-card border-b border-glass-border/50 mx-4 rounded-2xl"
          >
            {/* ... your menu code ... */}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
