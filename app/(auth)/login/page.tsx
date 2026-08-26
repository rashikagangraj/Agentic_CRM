'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { LogIn, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { loginSchema, type LoginFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandMark } from '@/components/ui/brand-mark';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const { login, isDemoMode } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: 'demo@agenticcrm.com',
            password: 'password123',
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            await login(data.email, data.password);
            toast.success('Welcome back to Agentic CRM!');
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto glass-card shadow-2xl rounded-3xl border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="space-y-3 text-center pt-8 pb-4">
                <div className="mx-auto flex items-center justify-center">
                    <BrandMark variant="full" size="lg" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                        Welcome to <span className="animated-gradient">Agentic CRM</span>
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
                        AI-powered business intelligence & workflow automation
                    </CardDescription>
                </div>

                {isDemoMode && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 mx-auto">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Local Demo Mode Active (Click Sign In)</span>
                    </div>
                )}
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4 px-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700 dark:text-slate-200 font-medium">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@business.com"
                            className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2 mb-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-slate-700 dark:text-slate-200 font-medium">Password</Label>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 px-6 pb-8">
                    <Button
                        type="submit"
                        className="w-full h-11 rounded-full bg-primary hover:bg-blue-600 text-white font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02]"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In to Dashboard'
                        )}
                    </Button>

                    <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                        Don't have an account?{' '}
                        <Link
                            href="/signup"
                            className="text-primary hover:underline font-semibold"
                        >
                            Create business account
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}

