import { Metadata } from "next"
import { Toaster } from "sonner"
import { AuthLayout } from "@/features/auth/components/AuthLayout"
import { RegisterForm } from "@/features/auth/components/RegisterForm"

export const metadata: Metadata = {
  title: "Sign up | Legixy",
  description: "Create your Legixy account.",
}

export default function RegisterPage() {
  return (
    <>
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
      <Toaster position="top-center" />
    </>
  )
}
