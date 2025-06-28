
import { AuthButton } from '@/components/auth/AuthButton';

export function DashboardHeader() {
  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            SEO Audit Dashboard
          </h1>
        </div>
        <AuthButton />
      </div>
    </header>
  );
}
