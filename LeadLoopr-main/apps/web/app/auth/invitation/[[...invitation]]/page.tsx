'use client'

import { SignUp, useSignUp } from "@clerk/nextjs"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function InvitationSignUpPage() {
    const { signUp, setActive } = useSignUp()
    const searchParams = useSearchParams()
    const orgIdFromUrl = searchParams.get('org_id')

    useEffect(() => {
        if (signUp && signUp.status === 'complete') {
            // Set the active session - webhooks will handle organization linking automatically
            setActive({ session: signUp.createdSessionId })
                .then(() => {
                    console.log('✅ User session activated successfully')
                    console.log('🔄 Webhooks will automatically link user to organization')
                })
                .catch((error) => {
                    console.error('❌ Error activating session:', error)
                })
        }
    }, [signUp, setActive])

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

                    {/* Left side - Sign up form */}
                    <div className="w-full max-w-md mx-auto lg:mx-0">
                        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 animate-scale-in">
                            <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 animate-fade-in">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-500/20 rounded-full">
                                        <svg className="h-4 w-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-white">
                                        You've been invited!
                                    </span>
                                </div>
                                <p className="text-sm text-blue-100 leading-relaxed">
                                    Complete your account to join the organization.
                                </p>
                            </div>

                            <SignUp
                                appearance={{
                                    elements: {
                                        formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed",
                                        card: "bg-transparent shadow-none",
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
                                        formFieldInput__firstName: "bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 transition-all duration-200",
                                        formFieldInput__lastName: "bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 transition-all duration-200",
                                        formFieldInput__emailAddress: "bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 transition-all duration-200",
                                        formFieldInput__password: "bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 transition-all duration-200",
                                        formFieldLabel__firstName: "text-white text-sm",
                                        formFieldLabel__lastName: "text-white text-sm",
                                        formFieldLabel__emailAddress: "text-white text-sm",
                                        formFieldLabel__password: "text-white text-sm",
                                    }
                                }}
                                redirectUrl="/dashboard"
                                signInUrl="/auth/sign-in"
                            />
                        </div>
                    </div>

                    {/* Right side - Hero content */}
                    <div className="hidden lg:block">
                        <div className="text-center lg:text-left space-y-6 animate-fade-in-right">
                            <div className="space-y-4">
                                <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                                    Welcome to
                                    <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent block">
                                        LeadLoopr
                                    </span>
                                </h1>
                                <p className="text-xl text-blue-100 leading-relaxed max-w-lg">
                                    You've been invited to join our team. Complete your account setup to start collaborating and managing leads together.
                                </p>
                            </div>

                            {/* Feature highlights */}
                            <div className="space-y-4 max-w-md">
                                <div className="flex items-center gap-3 text-white">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-sm">Join your team instantly</span>
                                </div>
                                <div className="flex items-center gap-3 text-white">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span className="text-sm">Access shared lead pipeline</span>
                                </div>
                                <div className="flex items-center gap-3 text-white">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                    <span className="text-sm">Collaborate with team members</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 