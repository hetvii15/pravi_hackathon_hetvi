import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center space-y-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">Infra360</p>
            <p className="text-sm text-muted-foreground">Sign in to the asset lifecycle platform</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <div className="space-y-1 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Demo accounts &middot; password: demo1234</p>
            <p>admin@infra360.demo &middot; roads@infra360.demo &middot; water@infra360.demo</p>
            <p>inspector@infra360.demo &middot; maintenance@infra360.demo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
