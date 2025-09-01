'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useSignIn } from '@clerk/nextjs'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingDots } from "@/components/ui/loading-dots"

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [code, setCode] = useState('')
    const [successfulCreation, setSuccessfulCreation] = useState(false)
    const [secondFactor, setSecondFactor] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter()
    const { isSignedIn } = useAuth()
    const { isLoaded, signIn, setActive } = useSignIn()

    useEffect(() => {
        if (isSignedIn) {
            router.push('/dashboard')
        }
    }, [isSignedIn, router])

    if (!isLoaded) {
        return (
            <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600"></div>
                <div className="relative z-10">
                    <LoadingDots />
                </div>
            </div>
        )
    }

    const requestCode = async (e: FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            await signIn?.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            })
            setSuccessfulCreation(true)
        } catch (err: any) {
            setError(err.errors?.[0]?.longMessage || 'Failed to send reset code. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const resetPassword = async (e: FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const result = await signIn?.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password,
            })

            if (result?.status === 'needs_second_factor') {
                setSecondFactor(true)
            } else if (result?.status === 'complete') {
                await setActive?.({ session: result.createdSessionId })
                router.push('/dashboard')
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.longMessage || 'Failed to reset password. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600"></div>

            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl"></div>
                <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-pink-300/20 rounded-full blur-2xl"></div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex items-center justify-center gap-8 max-w-4xl w-full mx-4">
                {/* Left side - Reset password form */}
                <div className="w-full max-w-sm">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {!successfulCreation ? 'Reset your password' : 'Enter reset code'}
                            </h1>
                            <p className="text-gray-600">
                                {!successfulCreation
                                    ? 'Enter your email to receive a reset code'
                                    : 'Enter the code sent to your email and your new password'
                                }
                            </p>
                        </div>

                        <form onSubmit={successfulCreation ? resetPassword : requestCode} className="space-y-4">
                            {!successfulCreation ? (
                                <>
                                    <div>
                                        <Input
                                            type="email"
                                            placeholder="Your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-12"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <LoadingDots /> : 'Send reset code'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <Input
                                            type="text"
                                            placeholder="Reset code"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            type="password"
                                            placeholder="New password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full h-12"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <LoadingDots /> : 'Reset password'}
                                    </Button>
                                </>
                            )}

                            {secondFactor && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                    <p className="text-yellow-800 text-sm">
                                        Two-factor authentication is required. Please complete 2FA to continue.
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}
                        </form>

                        <div className="mt-6 text-center">
                            <a
                                href="/auth/sign-in"
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                Back to sign in
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right side - Owl character */}
                <div className="hidden md:block">
                    <div className="relative w-[350px]">
                        <Image
                            src="/images/Sign-in.png"
                            alt="LeadLoopr Owl Mascot"
                            width={350}
                            height={350}
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    )
} 