'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { UserPlus, Loader2, Building2, MapPin, Package, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
    accountDetailsSchema,
    businessDetailsSchema,
    bestSellersSchema,
    type AccountDetailsFormData,
    type BusinessDetailsFormData,
    type BestSellersFormData,
} from '@/lib/schemas';
import { createBusinessProfile } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandMark } from '@/components/ui/brand-mark';
import { toast } from 'sonner';
import type { BusinessCategory } from '@/lib/types';

const BUSINESS_CATEGORIES: { value: BusinessCategory; label: string }[] = [
    { value: 'retail', label: 'Retail' },
    { value: 'restaurant', label: 'Restaurant/Food Service' },
    { value: 'e-commerce', label: 'E-Commerce' },
    { value: 'services', label: 'Professional Services' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'technology', label: 'Technology' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'other', label: 'Other' },
];

type Step = 1 | 2 | 3;

export default function SignupPage() {
    const router = useRouter();
    const { signup, refreshBusinessProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form data storage across steps
    const [accountData, setAccountData] = useState<AccountDetailsFormData | null>(null);
    const [businessData, setBusinessData] = useState<BusinessDetailsFormData | null>(null);

    // Step 1: Account Details Form
    const accountForm = useForm<AccountDetailsFormData>({
        resolver: zodResolver(accountDetailsSchema),
        defaultValues: accountData || {},
    });

    // Step 2: Business Details Form
    const businessForm = useForm<BusinessDetailsFormData>({
        resolver: zodResolver(businessDetailsSchema),
        defaultValues: businessData || {},
    });

    // Step 3: Best Sellers Form
    const [bestSellers, setBestSellers] = useState([
        { productName: '', description: '', averagePrice: 0 },
    ]);

    const addBestSeller = () => {
        setBestSellers([...bestSellers, { productName: '', description: '', averagePrice: 0 }]);
    };

    const removeBestSeller = (index: number) => {
        if (bestSellers.length > 1) {
            setBestSellers(bestSellers.filter((_, i) => i !== index));
        }
    };

    const handleAccountNext = (data: AccountDetailsFormData) => {
        setAccountData(data);
        setCurrentStep(2);
    };

    const handleBusinessNext = (data: BusinessDetailsFormData) => {
        setBusinessData(data);
        setCurrentStep(3);
    };

    const handleFinalSubmit = async () => {
        if (!accountData || !businessData) return;

        // Validate best sellers
        const validBestSellers = bestSellers.filter(
            (seller) => seller.productName.trim() !== '' && seller.averagePrice > 0
        );

        if (validBestSellers.length === 0) {
            toast.error('Please add at least one best seller with a valid price');
            return;
        }

        setIsLoading(true);
        try {
            // Create Firebase auth account
            const userCredential = await signup(accountData.email, accountData.password);
            const userId = userCredential.user.uid;

            // Create business profile in Firestore
            await createBusinessProfile(userId, {
                ownerName: accountData.ownerName,
                email: accountData.email,
                businessName: businessData.businessName,
                address: {
                    street: businessData.street,
                    city: businessData.city,
                    state: businessData.state,
                    zipCode: businessData.zipCode,
                    country: businessData.country,
                },
                category: businessData.category,
                niche: businessData.niche,
                bestSellers: validBestSellers,
            });

            // Refresh business profile in auth context
            await refreshBusinessProfile();

            toast.success('Account created successfully! Welcome aboard! 🎉');
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Signup error:', error);
            toast.error(error.message || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                    <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${currentStep === step
                            ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30 ring-4 ring-primary/15'
                            : currentStep > step
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                    >
                        {currentStep > step ? <Check className="w-4 h-4" /> : step}
                    </div>
                    {step < 3 && (
                        <div
                            className={`w-14 h-1 mx-2 rounded-full transition-all duration-300 ${currentStep > step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <Card className="w-full max-w-2xl mx-auto glass-card shadow-2xl rounded-3xl border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="space-y-3 text-center pt-8 pb-4">
                <div className="mx-auto flex items-center justify-center">
                    <BrandMark variant="full" size="lg" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                        Create Your <span className="animated-gradient">Business Account</span>
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
                        {currentStep === 1 && "Let's start with your account details"}
                        {currentStep === 2 && 'Tell us about your business'}
                        {currentStep === 3 && 'What are your best-selling products?'}
                    </CardDescription>
                </div>
            </CardHeader>

            {renderStepIndicator()}


            {/* Step 1: Account Details */}
            {currentStep === 1 && (
                <form onSubmit={accountForm.handleSubmit(handleAccountNext)}>
                    <CardContent className="space-y-4 px-6">
                        <div className="space-y-2">
                            <Label htmlFor="ownerName" className="text-slate-700 dark:text-slate-200 font-medium">Your Name</Label>
                            <Input
                                id="ownerName"
                                placeholder="John Doe"
                                className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                {...accountForm.register('ownerName')}
                            />
                            {accountForm.formState.errors.ownerName && (
                                <p className="text-xs text-red-500 font-medium">{accountForm.formState.errors.ownerName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 dark:text-slate-200 font-medium">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@business.com"
                                className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                {...accountForm.register('email')}
                            />
                            {accountForm.formState.errors.email && (
                                <p className="text-xs text-red-500 font-medium">{accountForm.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700 dark:text-slate-200 font-medium">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                {...accountForm.register('password')}
                            />
                            {accountForm.formState.errors.password && (
                                <p className="text-xs text-red-500 font-medium">{accountForm.formState.errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2 mb-6">
                            <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-200 font-medium">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                {...accountForm.register('confirmPassword')}
                            />
                            {accountForm.formState.errors.confirmPassword && (
                                <p className="text-xs text-red-500 font-medium">{accountForm.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 px-6 pb-8">
                        <Button
                            type="submit"
                            className="w-full h-11 rounded-full bg-primary hover:bg-blue-600 text-white font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02]"
                        >
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>

                        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:underline font-semibold">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            )}

            {/* Step 2: Business Details */}
            {currentStep === 2 && (
                <form onSubmit={businessForm.handleSubmit(handleBusinessNext)}>
                    <CardContent className="space-y-4 px-6">
                        <div className="space-y-2">
                            <Label htmlFor="businessName" className="text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" /> Business Name
                            </Label>
                            <Input
                                id="businessName"
                                placeholder="Acme Corp"
                                className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                {...businessForm.register('businessName')}
                            />
                            {businessForm.formState.errors.businessName && (
                                <p className="text-xs text-red-500 font-medium">{businessForm.formState.errors.businessName.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="street" className="text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary" /> Street Address
                                </Label>
                                <Input
                                    id="street"
                                    placeholder="123 Main St"
                                    className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    {...businessForm.register('street')}
                                />
                                {businessForm.formState.errors.street && (
                                    <p className="text-xs text-red-500 font-medium">{businessForm.formState.errors.street.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-slate-700 dark:text-slate-200 font-medium">City</Label>
                                <Input
                                    id="city"
                                    placeholder="New York"
                                    className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    {...businessForm.register('city')}
                                />
                                {businessForm.formState.errors.city && (
                                    <p className="text-xs text-red-500 font-medium">{businessForm.formState.errors.city.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state" className="text-slate-700 dark:text-slate-200 font-medium">State</Label>
                                <Input
                                    id="state"
                                    placeholder="NY"
                                    className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    {...businessForm.register('state')}
                                />
                                {businessForm.formState.errors.state && (
                                    <p className="text-xs text-red-500 font-medium">{businessForm.formState.errors.state.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="zipCode" className="text-slate-700 dark:text-slate-200 font-medium">ZIP Code</Label>
                                <Input
                                    id="zipCode"
                                    placeholder="10001"
                                    className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    {...businessForm.register('zipCode')}
                                />
                                {businessForm.formState.errors.zipCode && (
                                    <p className="text-xs text-red-500 font-medium">{businessForm.formState.errors.zipCode.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-slate-700 dark:text-slate-200 font-medium">Country</Label>
                                <Input
                                    id="country"
                                    placeholder="USA"
                                    className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    {...businessForm.register('country')}
                                />
                                {businessForm.formState.errors.country && (
                                    <p className="text-xs text-red-500 font-medium">{businessForm.formState.errors.country.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-slate-700 dark:text-slate-200 font-medium">Business Category</Label>
                            <Select
                                onValueChange={(value) => businessForm.setValue('category', value as BusinessCategory)}
                                defaultValue={businessData?.category}
                            >
                                <SelectTrigger className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                    {BUSINESS_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value} className="text-slate-900 dark:text-white">
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {businessForm.formState.errors.category && (
                                <p className="text-xs text-red-500 font-medium">{businessForm.formState.errors.category.message}</p>
                            )}
                        </div>

                        <div className="space-y-2 mb-6">
                            <Label htmlFor="niche" className="text-slate-700 dark:text-slate-200 font-medium">Business Niche</Label>
                            <Input
                                id="niche"
                                placeholder="e.g., Organic skincare products"
                                className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                {...businessForm.register('niche')}
                            />
                            <p className="text-xs text-slate-500">Describe what makes your business unique</p>
                            {businessForm.formState.errors.niche && (
                                <p className="text-xs text-red-500 font-medium">{businessForm.formState.errors.niche.message}</p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex gap-3 px-6 pb-8">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-11 rounded-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                            onClick={() => setCurrentStep(1)}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 h-11 rounded-full bg-primary hover:bg-blue-600 text-white font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02]"
                        >
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </form>
            )}

            {/* Step 3: Best Sellers */}
            {currentStep === 3 && (
                <>
                    <CardContent className="space-y-4 px-6">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold mb-2">
                            <Package className="w-5 h-5 text-primary" />
                            <span>Best Selling Products</span>
                        </div>

                        {bestSellers.map((seller, index) => (
                            <div key={index} className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Product #{index + 1}</Label>
                                    {bestSellers.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 h-7 px-2 rounded-full"
                                            onClick={() => removeBestSeller(index)}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>

                                <Input
                                    placeholder="Product name"
                                    value={seller.productName}
                                    onChange={(e) => {
                                        const updated = [...bestSellers];
                                        updated[index].productName = e.target.value;
                                        setBestSellers(updated);
                                    }}
                                    className="bg-white/90 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400"
                                />

                                <Input
                                    placeholder="Description (optional)"
                                    value={seller.description}
                                    onChange={(e) => {
                                        const updated = [...bestSellers];
                                        updated[index].description = e.target.value;
                                        setBestSellers(updated);
                                    }}
                                    className="bg-white/90 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400"
                                />

                                <Input
                                    type="number"
                                    placeholder="Average price"
                                    value={seller.averagePrice || ''}
                                    onChange={(e) => {
                                        const updated = [...bestSellers];
                                        updated[index].averagePrice = parseFloat(e.target.value) || 0;
                                        setBestSellers(updated);
                                    }}
                                    className="bg-white/90 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder:text-slate-400"
                                />
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 rounded-full border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                            onClick={addBestSeller}
                        >
                            + Add Another Product
                        </Button>
                    </CardContent>

                    <CardFooter className="flex gap-3 px-6 pb-8">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-11 rounded-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                            onClick={() => setCurrentStep(2)}
                            disabled={isLoading}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button
                            type="button"
                            className="flex-1 h-11 rounded-full bg-primary hover:bg-blue-600 text-white font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02]"
                            onClick={handleFinalSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Create Account
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </>
            )}
        </Card>
    );
}
