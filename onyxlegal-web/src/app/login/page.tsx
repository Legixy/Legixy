import { Metadata } from "next"
import { Toaster } from "sonner"
import { AuthLayout } from "@/features/auth/components/AuthLayout"
import { LoginForm } from "@/features/auth/components/LoginForm"

export const metadata: Metadata = {
  title: "Log in | Legixy",
  description: "Log in to your Legixy account.",
}

export default function LoginPage() {
  return (
    <>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
      <Toaster position="top-center" />
    </>
  )
}
