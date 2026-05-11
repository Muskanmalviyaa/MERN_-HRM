import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { useEffect, useRef } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Punch from "@/pages/Punch";
import Attendance from "@/pages/Attendance";
import Overtime from "@/pages/Overtime";
import Validation from "@/pages/Validation";
import Reports from "@/pages/Reports";
import AdminUsers from "@/pages/AdminUsers";
import AppLayout from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/hooks/use-theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
  },
  variables: {
    colorPrimary: "hsl(221.2 83.2% 53.3%)",
    colorForeground: "hsl(222.2 84% 4.9%)",
    colorMutedForeground: "hsl(215.4 16.3% 46.9%)",
    colorDanger: "hsl(0 84.2% 60.2%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(222.2 84% 4.9%)",
    colorNeutral: "hsl(214.3 31.8% 91.4%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.3rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-md w-[440px] max-w-full overflow-hidden border border-gray-200 shadow-md",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-gray-900 tracking-tight",
    headerSubtitle: "text-sm text-gray-500",
    socialButtonsBlockButtonText: "text-sm font-medium text-gray-700",
    formFieldLabel: "text-sm font-semibold text-gray-900",
    footerActionLink: "text-sm font-semibold text-primary hover:text-primary/90",
    footerActionText: "text-sm text-gray-500",
    dividerText: "text-xs font-semibold text-gray-400 uppercase",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

function ProtectedRoutes() {
  return (
    <>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
      <Show when="signed-in">
        <AppLayout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/punch" component={Punch} />
            <Route path="/attendance" component={Attendance} />
            <Route path="/overtime" component={Overtime} />
            <Route path="/validation" component={Validation} />
            <Route path="/reports" component={Reports} />
            <Route path="/admin/users" component={AdminUsers} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={() => (
            <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
              <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
            </div>
          )} />
          <Route path="/sign-up/*?" component={() => (
            <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
              <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
            </div>
          )} />
          <Route component={ProtectedRoutes} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <TooltipProvider delayDuration={0}>
          <ClerkProviderWithRoutes />
          <Toaster />
        </TooltipProvider>
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
