"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Image from "next/image";
import { Loader2, X, AlertCircle } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Validation functions
const validateEmail = (email: string) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

const validatePassword = (password: string) => {
	return password.length >= 8;
};

export default function SignUp() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [validationErrors, setValidationErrors] = useState({
		firstName: "",
		lastName: "", 
		email: "",
		password: "",
		passwordConfirmation: ""
	});

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const convertImageToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	};

	const validateForm = () => {
		const errors = {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			passwordConfirmation: ""
		};

		// Required fields
		if (!firstName.trim()) errors.firstName = "First name is required";
		if (!lastName.trim()) errors.lastName = "Last name is required";
		if (!email.trim()) errors.email = "Email is required";
		if (!password) errors.password = "Password is required";
		if (!passwordConfirmation) errors.passwordConfirmation = "Please confirm your password";

		// Email validation
		if (email && !/\S+@\S+\.\S+/.test(email)) {
			errors.email = "Please enter a valid email address";
		}

		// Password validation
		if (password && password.length < 8) {
			errors.password = "Password must be at least 8 characters long";
		}

		// Password confirmation
		if (password !== passwordConfirmation) {
			errors.passwordConfirmation = "Passwords do not match";
		}

		setValidationErrors(errors);
		return Object.values(errors).every(error => !error);
	};

	const handleSubmit = async () => {
		setError("");
		
		if (!validateForm()) {
			return;
		}

		try {
			await signUp.email({
				email,
				password,
				name: `${firstName} ${lastName}`,
				image: image ? await convertImageToBase64(image) : "",
				callbackURL: "/dashboard",
				fetchOptions: {
					onResponse: () => {
						setLoading(false);
					},
					onRequest: () => {
						setLoading(true);
					},
					onError: (ctx) => {
						setError(ctx.error.message || "An error occurred during registration");
						toast.error(ctx.error.message || "Registration failed");
					},
					onSuccess: async () => {
						toast.success("Account created successfully!");
						router.push("/dashboard");
					},
				},
			});
		} catch (err: any) {
			setError(err.message || "An unexpected error occurred");
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<Card className="z-50 rounded-md rounded-t-none max-w-md w-full">
			<CardHeader>
				<CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
				<CardDescription className="text-xs md:text-sm">
					Enter your information to create an account
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="first-name">First name</Label>
							<Input
								id="first-name"
								placeholder="Max"
								required
								onChange={(e) => {
									setFirstName(e.target.value);
									if (validationErrors.firstName) {
										setValidationErrors(prev => ({ ...prev, firstName: "" }));
									}
								}}
								value={firstName}
								className={validationErrors.firstName ? "border-red-500" : ""}
							/>
							{validationErrors.firstName && (
								<p className="text-sm text-red-500 flex items-center gap-1">
									<AlertCircle className="h-4 w-4" />
									{validationErrors.firstName}
								</p>
							)}
						</div>
						<div className="grid gap-2">
							<Label htmlFor="last-name">Last name</Label>
							<Input
								id="last-name"
								placeholder="Robinson"
								required
								onChange={(e) => {
									setLastName(e.target.value);
									if (validationErrors.lastName) {
										setValidationErrors(prev => ({ ...prev, lastName: "" }));
									}
								}}
								value={lastName}
								className={validationErrors.lastName ? "border-red-500" : ""}
							/>
							{validationErrors.lastName && (
								<p className="text-sm text-red-500 flex items-center gap-1">
									<AlertCircle className="h-4 w-4" />
									{validationErrors.lastName}
								</p>
							)}
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="m@example.com"
							required
							onChange={(e) => {
								setEmail(e.target.value);
								if (validationErrors.email) {
									setValidationErrors(prev => ({ ...prev, email: "" }));
								}
							}}
							value={email}
							className={validationErrors.email ? "border-red-500" : ""}
						/>
						{validationErrors.email && (
							<p className="text-sm text-red-500 flex items-center gap-1">
								<AlertCircle className="h-4 w-4" />
								{validationErrors.email}
							</p>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								if (validationErrors.password) {
									setValidationErrors(prev => ({ ...prev, password: "" }));
								}
							}}
							autoComplete="new-password"
							placeholder="Password (min. 8 characters)"
							className={validationErrors.password ? "border-red-500" : ""}
						/>
						{validationErrors.password && (
							<p className="text-sm text-red-500 flex items-center gap-1">
								<AlertCircle className="h-4 w-4" />
								{validationErrors.password}
							</p>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password_confirmation">Confirm Password</Label>
						<Input
							id="password_confirmation"
							type="password"
							value={passwordConfirmation}
							onChange={(e) => {
								setPasswordConfirmation(e.target.value);
								if (validationErrors.passwordConfirmation) {
									setValidationErrors(prev => ({ ...prev, passwordConfirmation: "" }));
								}
							}}
							autoComplete="new-password"
							placeholder="Confirm Password"
							className={validationErrors.passwordConfirmation ? "border-red-500" : ""}
						/>
						{validationErrors.passwordConfirmation && (
							<p className="text-sm text-red-500 flex items-center gap-1">
								<AlertCircle className="h-4 w-4" />
								{validationErrors.passwordConfirmation}
							</p>
						)}
					</div>
					{/* <div className="grid gap-2">
						<Label htmlFor="image">Profile Image (optional)</Label>
						<div className="flex items-end gap-4">
							{imagePreview && (
								<div className="relative w-16 h-16 rounded-sm overflow-hidden">
									<Image
										src={imagePreview}
										alt="Profile preview"
										layout="fill"
										objectFit="cover"
									/>
								</div>
							)}
							<div className="flex items-center gap-2 w-full">
								<Input
									id="image"
									type="file"
									accept="image/*"
									onChange={handleImageChange}
									className="w-full"
								/>
								{imagePreview && (
									<X
										className="cursor-pointer"
										onClick={() => {
											setImage(null);
											setImagePreview(null);
										}}
									/>
								)}
							</div>
						</div>
					</div> */}
					{error && (
						<div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
							<AlertCircle className="h-4 w-4" />
							{error}
						</div>
					)}

					<Button
						type="submit"
						className="w-full"
						disabled={loading}
						onClick={handleSubmit}
					>
						{loading ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							"Create an account"
						)}
					</Button>
				</div>
			</CardContent>
          <CardFooter className="flex flex-col gap-4">
				<div className="flex justify-center w-full">
					<p className="text-center text-sm text-gray-600">
						Already have an account?{" "}
						<Link
							href="/login"
							className="font-medium text-blue-600 hover:text-blue-500 underline"
						>
							Sign in
						</Link>
					</p>
				</div>
				<div className="flex justify-center w-full border-t py-4">
					<p className="text-center text-xs text-neutral-500">
						Secured by <span className="text-orange-400">better-auth.</span>
					</p>
				</div>
			</CardFooter>
			</Card>
		</div>
	);
}

async function convertImageToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}