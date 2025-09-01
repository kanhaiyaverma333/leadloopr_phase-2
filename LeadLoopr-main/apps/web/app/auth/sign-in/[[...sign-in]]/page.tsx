'use client'

import { SignIn } from "@clerk/nextjs"
import Image from "next/image"

export default function SignInPage() {
    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Static background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700"></div>

            {/* Static background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-300/10 rounded-full blur-2xl"></div>
                <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-pink-300/10 rounded-full blur-2xl"></div>
            </div>

            {/* Main content container */}
            <div className="relative z-10 w-full max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                    {/* Left side - Login form */}
                    <div className="w-full max-w-md mx-auto lg:mx-0">
                        <SignIn
                            appearance={{
                                elements: {
                                    formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed",
                                    card: "bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl animate-scale-in",
                                    headerTitle: "text-2xl font-bold text-white mb-2",
                                    headerSubtitle: "text-blue-100",
                                    formFieldInput: "bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 transition-all duration-200",
                                    formFieldLabel: "text-white text-sm",
                                    formFieldLabelRow: "text-white",
                                    formFieldInputShowPasswordButton: "text-gray-400 hover:text-white",
                                    formFieldInputShowPasswordButtonIcon: "text-gray-400 hover:text-white",
                                    formFieldErrorText: "text-red-300",
                                    formFieldHintText: "text-blue-100",
                                    dividerLine: "bg-white/20",
                                    dividerText: "bg-white/10 backdrop-blur-sm text-blue-100",
                                    socialButtonsBlockButton: "bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-200",
                                    socialButtonsBlockButtonText: "text-white",
                                    socialButtonsBlockButtonArrow: "text-white",
                                    footerActionLink: "text-white font-medium hover:underline transition-all duration-200",
                                    footerActionText: "text-blue-100",
                                    formResendCodeLink: "text-blue-200 hover:text-white",
                                    formFieldRow: "text-white",
                                    formHeaderTitle: "text-white",
                                    formHeaderSubtitle: "text-blue-100",
                                    formFieldInput__identifier: "bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 transition-all duration-200",
                                    formFieldInput__password: "bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 transition-all duration-200",
                                    formFieldLabel__identifier: "text-white text-sm",
                                    formFieldLabel__password: "text-white text-sm",
                                }
                            }}
                            path="/auth/sign-in"
                            signUpUrl="/auth/sign-up"
                            redirectUrl="/dashboard"
                        />
                    </div>

                    {/* Right side - Hero content */}
                    <div className="hidden lg:block">
                        <div className="text-center lg:text-left space-y-6 animate-fade-in-right">
                            <div className="space-y-4">
                                <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                                    Welcome Back to
                                    <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent block">
                                        LeadLoopr
                                    </span>
                                </h1>
                                <p className="text-xl text-blue-100 leading-relaxed max-w-lg">
                                    Sign in to access your dashboard and continue managing your leads and campaigns.
                                </p>
                            </div>

                            {/* Feature highlights */}
                            <div className="space-y-4 max-w-md">
                                <div className="flex items-center gap-3 text-white">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-sm">Secure and reliable authentication</span>
                                </div>
                                <div className="flex items-center gap-3 text-white">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span className="text-sm">Access your lead pipeline</span>
                                </div>
                                <div className="flex items-center gap-3 text-white">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                    <span className="text-sm">Manage your team and campaigns</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 