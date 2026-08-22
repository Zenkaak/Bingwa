import { type FormEvent, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Activity, ArrowRight, BarChart3, Check, CircleHelp, Clock3, CreditCard, Database,
  ExternalLink, Filter, LayoutGrid, LogIn, Menu, PackageCheck, Search, Settings,
  ShieldCheck, ShoppingBag, Sparkles, Store, Users, X, Zap, type LucideIcon
} from "lucide-react";
import { Link, Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import {
  getGetAdminSummaryQueryKey, getGetStoreSettingsQueryKey, getHealthCheckQueryKey, getListAdminDealsQueryKey,
  getListCustomersQueryKey, getListDealsQueryKey, getListOrdersQueryKey,
  useAdminLogin, useGetAdminSummary, useGetStoreSettings, useHealthCheck,
  useListAdminDeals, useListCustomers, useListDeals, useListOrders,
  useStartCheckout, useUpdateDeal, useUpdateStoreSettings
} from "@workspace/api-client-react";
import type { Deal, DealUpdate, StoreSettings } from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const fallbackDeals: Deal[] = [
  { id: "10gb", category: "data", quantity: "10GB", price: 77, validity: "NO EXPIRY", repeatable: false },
  { id: "18gb-mins", category: "data", quantity: "18GB + 200MINS", price: 155, validity: "NO EXPIRY", repeatable: false },
  { id: "promo-17gb", category: "data", quantity: "PROMO 17GB", price: 99, validity: "NO EXPIRY", repeatable: false },
  { id: "20gb-mins", category: "data", quantity: "20GB + 200MINS", price: 200, validity: "NO EXPIRY", repeatable: false },
  { id: "night", category: "data", quantity: "UNLIMITED NIGHT", price: 100, validity: "1 NIGHT", repeatable: false },
  { id: "24gb-mins", category: "data", quantity: "24GB + 200MINS", price: 200, validity: "NO EXPIRY", repeatable: false },
  { id: "18gb", category: "data", quantity: "18GB", price: 110, validity: "NO EXPIRY", repeatable: false },
  { id: "25gb-mins", category: "data", quantity: "25GB + 200MINS", price: 210, validity: "NO EXPIRY", repeatable: false },
  { id: "14gb", category: "data", quantity: "14GB", price: 140, validity: "NO EXPIRY", repeatable: false },
  { id: "15gb-mins", category: "data", quantity: "15GB + 500MINS", price: 220, validity: "NO EXPIRY", repeatable: false },
  { id: "8gb", category: "data", quantity: "8GB", price: 65, validity: "7 DAYS", repeatable: true },
  { id: "sms-1500", category: "sms", quantity: "1,500 SMS", price: 75, validity: "30 DAYS", repeatable: true },
];

const categoryMeta = [
  { id: "data", label: "Data Bundles", caption: "Internet packages", icon: Database },
  { id: "tokens", label: "KPLC Tokens", caption: "Electricity", icon: Zap },
  { id: "loans", label: "Loan Limits", caption: "Upgrade", icon: BarChart3 },
];
const carriers = ["Safaricom", "Airtel", "Telkom"];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-home-logo">
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-primary/50 bg-primary text-primary-foreground shadow-[0_0_22px_hsl(163_94%_48%_/_0.18)]">
        <span className="grid h-4 w-4 place-items-center rounded-full border-2 border-current">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      </span>
      {!compact && <span className="leading-none"><strong className="block text-[15px] tracking-tight text-foreground">Bingwa</strong><small className="mt-1 block font-mono-app text-[8px] uppercase tracking-[.22em] text-primary">services / ke</small></span>}
    </Link>
  );
}

function TopBar({ onAdmin }: { onAdmin: () => void }) {
  const [, setLocation] = useLocation();
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[58px] max-w-[1180px] items-center justify-between px-3 sm:px-5">
        <Logo />
        <div className="hidden items-center gap-4 text-[10px] text-muted-foreground sm:flex">
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3 w-3 text-primary" /> Avg delivery <b className="text-foreground">12s</b></span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-primary" /> Secured by <b className="text-foreground">M-Pesa</b></span>
          <span className="inline-flex items-center gap-1.5"><CircleHelp className="h-3 w-3 text-primary" /> Support <b className="text-foreground">24/7</b></span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLocation("/admin")} className="hidden rounded-lg border border-primary/25 bg-primary/5 px-3 py-1.5 text-[10px] font-bold text-primary transition hover:bg-primary/10 sm:block" data-testid="button-staff-login">Staff login</button>
          <button onClick={onAdmin} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:border-primary/50 hover:text-primary sm:hidden" data-testid="button-mobile-admin"><Menu className="h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
}

function StatsStrip() {
  const stats: Array<{ value: string; label: string; Icon: LucideIcon }> = [
    { value: "1,287", label: "orders today", Icon: Activity },
    { value: "8,953+", label: "happy customers", Icon: Users },
    { value: "4.9/5", label: "rating", Icon: Sparkles },
    { value: "48,173", label: "total delivered", Icon: PackageCheck },
  ];
  return (
    <section className="mx-auto mt-3 max-w-[1180px] px-3 sm:px-5" aria-label="Store statistics">
      <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/70 sm:grid-cols-4 sm:divide-y-0">
        {stats.map(({ value, label, Icon }, index) => (
          <div key={label as string} className="flex items-center justify-center gap-2 px-3 py-2.5" data-testid={`stat-${index}`}>
            <Icon className={`hidden h-3.5 w-3.5 sm:block ${index === 1 ? "text-accent" : "text-primary"}`} />
            <div><div className="font-mono-app text-sm font-medium leading-none text-foreground">{value}</div><div className="mt-1 text-[8px] uppercase tracking-[.14em] text-muted-foreground">{label}</div></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryRail({ active, onChange }: { active: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2" data-testid="category-rail">
      {categoryMeta.map(({ id, label, caption, icon: Icon }) => (
        <button key={id} onClick={() => onChange(id)} className={`group relative min-h-[58px] rounded-xl border p-2.5 text-left transition sm:min-h-[68px] sm:p-3 ${active === id ? "border-primary/45 bg-primary/[.09]" : "border-border bg-card/55 hover:border-primary/30"}`} data-testid={`button-category-${id}`}>
          <div className={`mb-1.5 grid h-6 w-6 place-items-center rounded-lg ${active === id ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}><Icon className="h-3.5 w-3.5" /></div>
          <div className="text-[10px] font-bold text-foreground sm:text-[11px]">{label}</div>
          <div className="text-[8px] text-muted-foreground">{caption}</div>
          {active === id && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  );
}

function DealCard({ deal, onBuy, index }: { deal: Deal; onBuy: (deal: Deal) => void; index: number }) {
  const isPromo = deal.quantity.toLowerCase().includes("promo") || index === 4;
  return (
    <article className="deal-card appear group relative overflow-hidden rounded-xl border border-primary/25 bg-card/75" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }} data-testid={`card-deal-${deal.id}`}>
      {isPromo && <span className="absolute left-0 top-0 rounded-br-md bg-destructive px-2 py-0.5 font-mono-app text-[8px] font-medium tracking-wider text-destructive-foreground">HOT</span>}
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><span className="h-1.5 w-1.5 rounded-full bg-current" /></span>
          <span className="truncate text-[10px] font-semibold tracking-tight text-foreground">{deal.quantity}</span>
        </div>
        <button onClick={() => navigator.clipboard?.writeText(deal.quantity)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-primary" data-testid={`button-share-deal-${deal.id}`} aria-label="Copy deal name"><ExternalLink className="h-3 w-3" /></button>
      </div>
      <div className="flex items-end justify-between gap-3 px-3 py-2">
        <div><div className="font-mono-app text-[8px] uppercase text-primary">KSH <strong className="text-sm font-medium">{deal.price}</strong></div><div className="mt-1 font-mono-app text-[7px] uppercase text-muted-foreground">{deal.validity || "NO EXPIRY"}</div></div>
        <button onClick={() => onBuy(deal)} className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[9px] font-extrabold text-primary-foreground transition hover:bg-primary/85" data-testid={`button-buy-deal-${deal.id}`}>Buy <ArrowRight className="h-3 w-3" /></button>
      </div>
    </article>
  );
}

function CheckoutDialog({ deal, onClose }: { deal: Deal | null; onClose: () => void }) {
  const checkout = useStartCheckout();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  if (!deal) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    checkout.mutate({ data: { dealId: deal.id, phoneNumber: phone, customerName: name || null } }, { onSuccess: onClose });
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-3 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-card p-4 shadow-2xl sm:p-5" data-testid="dialog-checkout">
        <div className="mb-4 flex items-start justify-between"><div><div className="font-mono-app text-[9px] uppercase tracking-[.18em] text-primary">secure checkout</div><h2 className="mt-1 text-lg font-bold">{deal.quantity}</h2><p className="text-xs text-muted-foreground">KSH {deal.price} · delivery in about 12 seconds</p></div><button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" data-testid="button-close-checkout"><X className="h-4 w-4" /></button></div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">M-Pesa phone number<input required minLength={9} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 font-mono-app text-sm text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground/50 focus:ring-2" data-testid="input-checkout-phone" /></label>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Name <span className="normal-case tracking-normal opacity-60">optional</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="How should we address you?" className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-primary/40 placeholder:text-muted-foreground/50 focus:ring-2" data-testid="input-checkout-name" /></label>
          {checkout.isError && <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive" data-testid="status-checkout-error">We could not start the payment. Check the number and try again.</p>}
          {checkout.isSuccess && <p className="rounded-lg bg-primary/10 p-2 text-xs text-primary" data-testid="status-checkout-success">Payment prompt sent. Check your phone.</p>}
          <button disabled={checkout.isPending} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-extrabold text-primary-foreground disabled:opacity-60" data-testid="button-confirm-checkout">{checkout.isPending ? "Sending prompt..." : <>Pay KSH {deal.price} <ArrowRight className="h-3.5 w-3.5" /></>}</button>
        </form>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground"><ShieldCheck className="h-3 w-3 text-primary" /> Secure M-Pesa checkout · no card details stored</div>
      </div>
    </div>
  );
}

function Home() {
  const [, setLocation] = useLocation();
  const { data: deals, isLoading, isError, refetch } = useListDeals({ query: { queryKey: getListDealsQueryKey() } });
  const { data: settings } = useGetStoreSettings({ query: { queryKey: getGetStoreSettingsQueryKey() } });
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const [category, setCategory] = useState("data");
  const [carrier, setCarrier] = useState("Safaricom");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Deal | null>(null);
  const visibleDeals = useMemo(() => {
    const source = deals?.length ? deals : fallbackDeals;
    return source.filter((deal) => (category === "data" ? deal.category === "data" : category === "sms" ? deal.category === "sms" : true)).filter((deal) => deal.quantity.toLowerCase().includes(search.toLowerCase()) || deal.validity.toLowerCase().includes(search.toLowerCase()));
  }, [deals, category, search]);
  const store = settings as StoreSettings | undefined;
  return (
    <div className="bingwa-shell min-h-[100dvh] text-foreground">
      <TopBar onAdmin={() => setLocation("/admin")} />
      <main className="mx-auto max-w-[1180px] px-3 pb-16 sm:px-5">
        <StatsStrip />
        <div className="my-2 flex items-center justify-between rounded-lg border border-border/70 bg-card/45 px-3 py-1.5 text-[9px] text-muted-foreground" data-testid="announcement-bar"><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(163_94%_48%)]" />Susan A. just bought <b className="text-foreground">18GB</b></span><span className="hidden sm:block">just now</span></div>
        <section className="grid-noise relative mt-3 overflow-hidden rounded-2xl border border-primary/20 bg-primary/[.035] p-4 sm:p-5" data-testid="section-catalogue-intro">
          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="font-mono-app text-[9px] uppercase tracking-[.24em] text-primary">Nairobi's everyday connection counter</div><h1 className="mt-2 max-w-xl text-2xl font-extrabold tracking-[-.05em] text-foreground sm:text-3xl">Stay in the <span className="text-primary">loop.</span></h1><p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">Data, minutes, and SMS bundles that get straight to the point. Pick a lane, pay from your phone, keep moving.</p></div><div className="flex shrink-0 items-center gap-4 border-l border-primary/25 pl-4 text-xs sm:pb-1"><div><b className="block text-lg text-foreground">1 min</b><span className="text-[9px] text-muted-foreground">to checkout</span></div><div><b className="block text-lg text-foreground">M-Pesa</b><span className="text-[9px] text-muted-foreground">secure payment</span></div></div></div>
        </section>
        <section className="mt-4"><div className="mb-2 flex items-center justify-between"><div><div className="font-mono-app text-[9px] uppercase tracking-[.22em] text-primary">Live catalogue</div><h2 className="mt-1 text-lg font-bold tracking-tight">Pick your connection</h2></div><div className="hidden items-center gap-1.5 text-[9px] text-muted-foreground sm:flex"><span className={`h-1.5 w-1.5 rounded-full ${health?.status ? "bg-primary" : "bg-accent"}`} />{health?.status === "ok" ? "system online" : "instant delivery"}</div></div>
          <CategoryRail active={category} onChange={setCategory} />
          <div className="mt-2 flex items-center gap-2 overflow-x-auto rounded-xl border border-border bg-card/55 p-1" data-testid="carrier-tabs">{carriers.map((item) => <button key={item} onClick={() => setCarrier(item)} className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${carrier === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`} data-testid={`button-carrier-${item.toLowerCase()}`}>{item}</button>)}<span className="ml-auto hidden pr-2 text-[9px] text-muted-foreground sm:block">Bundles available on {carrier}</span></div>
          <div className="mt-2 flex gap-2"><label className="relative block flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search packages or validity..." className="h-9 w-full rounded-lg border border-input bg-card/80 pl-9 pr-3 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/60" data-testid="input-search-deals" /></label><button className="grid h-9 w-9 place-items-center rounded-lg border border-input bg-card/80 text-muted-foreground hover:border-primary/50 hover:text-primary" data-testid="button-filter-deals"><Filter className="h-3.5 w-3.5" /></button></div>
          {isError && <div className="mt-2 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-[10px] text-accent" data-testid="status-deals-error"><span>Live catalogue unavailable — showing popular bundles.</span><button onClick={() => refetch()} className="font-bold underline" data-testid="button-retry-deals">Retry</button></div>}
          {isLoading ? <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[78px] animate-pulse rounded-xl border border-border bg-card/70" data-testid={`skeleton-deal-${i}`} />)}</div> : visibleDeals.length ? <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">{visibleDeals.map((deal, index) => <DealCard key={deal.id} deal={deal} onBuy={setSelected} index={index} />)}</div> : <div className="mt-2 rounded-xl border border-dashed border-border p-8 text-center" data-testid="empty-deals"><ShoppingBag className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-2 text-xs font-bold">No bundles match that search</p><button onClick={() => setSearch("")} className="mt-2 text-[10px] font-bold text-primary underline" data-testid="button-clear-search">Clear search</button></div>}
        </section>
        <footer className="mt-8 flex flex-col gap-2 border-t border-border/70 pt-4 text-[9px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Bingwa <span className="text-border">/</span> fast services for Kenya</span><span>{store?.contactName ? `Need help? ${store.contactName}` : "Support 24/7"} <span className="mx-1 text-border">·</span> {store?.customerCare || "M-Pesa secured"}</span></footer>
      </main>
      <CheckoutDialog deal={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const login = useAdminLogin();
  const [password, setPassword] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); login.mutate({ data: { password } }, { onSuccess }); };
  return <div className="grid min-h-[100dvh] place-items-center bg-background p-4"><div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl"><Logo /><div className="mt-8"><div className="font-mono-app text-[9px] uppercase tracking-[.2em] text-primary">staff console</div><h1 className="mt-1 text-xl font-extrabold">Welcome back.</h1><p className="mt-1 text-xs text-muted-foreground">Manage catalogue and keep the counter moving.</p></div><form onSubmit={submit} className="mt-6 space-y-3"><label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Staff password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" data-testid="input-admin-password" /></label>{login.isError && <p className="text-xs text-destructive" data-testid="status-admin-login-error">Password not accepted. Try again.</p>}<button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-bold text-primary-foreground" disabled={login.isPending} data-testid="button-admin-submit">{login.isPending ? "Checking..." : <>Enter console <LogIn className="h-3.5 w-3.5" /></>}</button></form><Link href="/" className="mt-5 block text-center text-[10px] font-semibold text-muted-foreground hover:text-primary" data-testid="link-back-store">Back to store</Link></div></div>;
}

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [section, setSection] = useState<"overview" | "deals" | "orders" | "customers" | "settings">("overview");
  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;
  return <AdminConsole section={section} onSection={setSection} onLogout={() => setAuthed(false)} />;
}

function AdminConsole({ section, onSection, onLogout }: { section: string; onSection: (section: "overview" | "deals" | "orders" | "customers" | "settings") => void; onLogout: () => void }) {
  const sections = [
    ["overview", "Overview", BarChart3], ["deals", "Catalogue", LayoutGrid], ["orders", "Orders", ShoppingBag], ["customers", "Customers", Users], ["settings", "Store settings", Settings],
  ] as const;
  return <div className="min-h-[100dvh] bg-background text-foreground"><aside className="fixed inset-y-0 left-0 z-20 hidden w-56 border-r border-border bg-sidebar p-4 md:block"><Logo /><div className="mt-9 space-y-1">{sections.map(([id, label, Icon]) => <button key={id} onClick={() => onSection(id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${section === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`} data-testid={`button-admin-nav-${id}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div><button onClick={onLogout} className="absolute bottom-5 left-4 flex items-center gap-2 text-[10px] text-muted-foreground hover:text-destructive" data-testid="button-admin-logout"><X className="h-3.5 w-3.5" />Sign out</button></aside><div className="md:pl-56"><header className="sticky top-0 z-10 flex h-[58px] items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-8"><div className="flex items-center gap-2 md:hidden"><Logo compact /><span className="text-xs font-bold">Staff console</span></div><div className="hidden text-xs font-bold capitalize md:block">{section}</div><Link href="/" className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-primary" data-testid="link-admin-store"><Store className="h-3.5 w-3.5" /> View store</Link></header><nav className="flex gap-1 overflow-x-auto border-b border-border bg-card/30 p-2 md:hidden">{sections.map(([id, label, Icon]) => <button key={id} onClick={() => onSection(id)} className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${section === id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`} data-testid={`button-mobile-nav-${id}`}><Icon className="h-3 w-3" />{label}</button>)}</nav><main className="mx-auto max-w-6xl p-4 md:p-8">{section === "overview" && <Overview />} {section === "deals" && <DealsAdmin />} {section === "orders" && <OrdersAdmin />} {section === "customers" && <CustomersAdmin />} {section === "settings" && <SettingsAdmin />}</main></div></div>;
}

function AdminState({ error, retry }: { error: boolean; retry: () => void }) {
  if (!error) return null;
  return <div className="flex items-center justify-between rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-xs text-destructive" data-testid="status-admin-error">Could not load this panel.<button onClick={retry} className="font-bold underline" data-testid="button-admin-retry">Retry</button></div>;
}

function Overview() {
  const summary = useGetAdminSummary({ query: { enabled: true, queryKey: getGetAdminSummaryQueryKey() } });
  const s = summary.data;
  if (summary.isLoading) return <div className="grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div className="h-24 animate-pulse rounded-xl border border-border bg-card" key={i} />)}</div>;
  const adminStats: Array<{ label: string; value: string | number; Icon: LucideIcon }> = [
    { label: "Today orders", value: s?.todayOrders ?? 0, Icon: Activity },
    { label: "Today revenue", value: `KSH ${s?.todayRevenue ?? 0}`, Icon: CreditCard },
    { label: "Completion rate", value: `${s?.completionRate ?? 0}%`, Icon: Check },
    { label: "Total orders", value: s?.totalOrders ?? 0, Icon: PackageCheck },
  ];
  return <div><div className="mb-5"><div className="font-mono-app text-[9px] uppercase tracking-[.2em] text-primary">Today at Bingwa</div><h1 className="mt-1 text-2xl font-extrabold tracking-tight">Good morning, operator.</h1></div><AdminState error={summary.isError} retry={() => summary.refetch()} />{s && <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{adminStats.map(({ label, value, Icon }, i) => <div key={label} className="rounded-xl border border-border bg-card p-4" data-testid={`admin-stat-${i}`}><Icon className="h-4 w-4 text-primary" /><div className="mt-4 font-mono-app text-xl">{value}</div><div className="mt-1 text-[10px] text-muted-foreground">{label}</div></div>)}</div><div className="mt-5 rounded-xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="text-xs font-bold">Recent orders</h2><span className="font-mono-app text-[9px] text-muted-foreground">{s.recentOrders.length} records</span></div>{s.recentOrders.length ? s.recentOrders.slice(0, 6).map((order) => <div key={order.id} className="flex items-center justify-between border-b border-border/60 px-4 py-3 last:border-0" data-testid={`row-recent-order-${order.id}`}><div><span className="font-mono-app text-[10px]">#{order.id}</span><span className="ml-3 text-[10px] text-muted-foreground">{order.phoneNumber}</span></div><div className="flex items-center gap-3"><span className="font-mono-app text-[10px]">KSH {order.amount}</span><span className={`rounded px-1.5 py-0.5 text-[8px] uppercase ${order.status === "completed" ? "bg-primary/10 text-primary" : order.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>{order.status}</span></div></div>) : <div className="p-8 text-center text-xs text-muted-foreground" data-testid="empty-recent-orders">No orders yet.</div>}</div></>}</div>;
}

function DealsAdmin() {
  const deals = useListAdminDeals({ query: { enabled: true, queryKey: getListAdminDealsQueryKey() } });
  const update = useUpdateDeal();
  const client = useQueryClient();
  const [editing, setEditing] = useState<Deal | null>(null);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!editing) return; const form = new FormData(event.currentTarget); const data: DealUpdate = { quantity: String(form.get("quantity")), price: Number(form.get("price")), validity: String(form.get("validity")), category: editing.category }; update.mutate({ id: editing.id, data }, { onSuccess: () => { setEditing(null); client.invalidateQueries({ queryKey: getListAdminDealsQueryKey() }); client.invalidateQueries({ queryKey: getListDealsQueryKey() }); } }); };
  return <div><div className="mb-5"><div className="font-mono-app text-[9px] uppercase tracking-[.2em] text-primary">Catalogue control</div><h1 className="mt-1 text-2xl font-extrabold">Deals</h1></div><AdminState error={deals.isError} retry={() => deals.refetch()} />{editing && <form onSubmit={submit} className="mb-4 grid gap-2 rounded-xl border border-primary/30 bg-primary/[.04] p-4 sm:grid-cols-4"><input name="quantity" defaultValue={editing.quantity} className="h-9 rounded-lg border border-input bg-background px-3 text-xs" data-testid="input-edit-quantity" /><input name="price" type="number" defaultValue={editing.price} className="h-9 rounded-lg border border-input bg-background px-3 font-mono-app text-xs" data-testid="input-edit-price" /><input name="validity" defaultValue={editing.validity} className="h-9 rounded-lg border border-input bg-background px-3 text-xs" data-testid="input-edit-validity" /><div className="flex gap-2"><button className="flex-1 rounded-lg bg-primary text-xs font-bold text-primary-foreground" disabled={update.isPending} data-testid="button-save-deal">Save</button><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-border px-3 text-xs" data-testid="button-cancel-edit">Cancel</button></div></form>}<div className="overflow-hidden rounded-xl border border-border bg-card">{deals.isLoading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading catalogue...</div> : deals.data?.length ? deals.data.map((deal) => <div key={deal.id} className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-0" data-testid={`row-admin-deal-${deal.id}`}><div className="min-w-0"><div className="truncate text-xs font-bold">{deal.quantity}</div><div className="mt-1 font-mono-app text-[9px] text-muted-foreground">{deal.category} · {deal.validity}</div></div><div className="flex items-center gap-3"><span className="font-mono-app text-xs text-primary">KSH {deal.price}</span><button onClick={() => setEditing(deal)} className="rounded-md border border-border px-2.5 py-1.5 text-[10px] font-bold hover:border-primary hover:text-primary" data-testid={`button-edit-deal-${deal.id}`}>Edit</button></div></div>) : <div className="p-8 text-center text-xs text-muted-foreground" data-testid="empty-admin-deals">No deals found.</div>}</div></div>;
}

function OrdersAdmin() {
  const orders = useListOrders(undefined, { query: { enabled: true, queryKey: getListOrdersQueryKey() } });
  const [status, setStatus] = useState("");
  const filtered = orders.data?.filter((order) => !status || order.status === status);
  return <div><div className="mb-5 flex items-end justify-between"><div><div className="font-mono-app text-[9px] uppercase tracking-[.2em] text-primary">Money movement</div><h1 className="mt-1 text-2xl font-extrabold">Orders</h1></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 rounded-lg border border-input bg-card px-2 text-[10px]" data-testid="select-order-status"><option value="">All statuses</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option></select></div><AdminState error={orders.isError} retry={() => orders.refetch()} /><div className="overflow-auto rounded-xl border border-border bg-card">{orders.isLoading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading orders...</div> : filtered?.length ? <table className="w-full min-w-[620px] text-left"><thead className="border-b border-border bg-secondary/30 text-[9px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Deal</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id} className="border-b border-border/60 text-[10px] last:border-0" data-testid={`row-order-${order.id}`}><td className="px-4 py-3 font-mono-app">#{order.id}</td><td className="px-4 py-3">{order.phoneNumber}</td><td className="px-4 py-3 font-mono-app">{order.dealId}</td><td className="px-4 py-3 font-mono-app">KSH {order.amount}</td><td className="px-4 py-3"><span className="rounded bg-secondary px-1.5 py-1 uppercase">{order.status}</span></td></tr>)}</tbody></table> : <div className="p-8 text-center text-xs text-muted-foreground" data-testid="empty-orders">No orders in this view.</div>}</div></div>;
}

function CustomersAdmin() {
  const [query, setQuery] = useState("");
  const customers = useListCustomers(query ? { q: query } : undefined, { query: { enabled: true, queryKey: getListCustomersQueryKey(query ? { q: query } : undefined) } });
  return <div><div className="mb-5"><div className="font-mono-app text-[9px] uppercase tracking-[.2em] text-primary">People who keep us moving</div><h1 className="mt-1 text-2xl font-extrabold">Customers</h1></div><div className="relative mb-3 max-w-sm"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, reference" className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-[11px] outline-none focus:border-primary" data-testid="input-search-customers" /></div><AdminState error={customers.isError} retry={() => customers.refetch()} /><div className="overflow-hidden rounded-xl border border-border bg-card">{customers.isLoading ? <div className="p-8 text-center text-xs text-muted-foreground">Loading customers...</div> : customers.data?.length ? customers.data.map((customer) => <div key={customer.id} className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-0" data-testid={`row-customer-${customer.id}`}><div><div className="text-xs font-bold">{customer.name || "Unnamed customer"}</div><div className="mt-1 font-mono-app text-[9px] text-muted-foreground">{customer.phoneNumber}</div></div><div className="text-right"><div className="font-mono-app text-[10px] text-primary">KSH {customer.totalSpent}</div><div className="mt-1 text-[9px] text-muted-foreground">{customer.orderCount} orders</div></div></div>) : <div className="p-8 text-center text-xs text-muted-foreground" data-testid="empty-customers">No customers found.</div>}</div></div>;
}

function SettingsAdmin() {
  const settings = useGetStoreSettings();
  const update = useUpdateStoreSettings();
  const [saved, setSaved] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); update.mutate({ data: { contactName: String(form.get("contactName")), customerCare: String(form.get("customerCare")), tillNumber: String(form.get("tillNumber")) } }, { onSuccess: () => setSaved(true) }); };
  return <div><div className="mb-5"><div className="font-mono-app text-[9px] uppercase tracking-[.2em] text-primary">Store identity</div><h1 className="mt-1 text-2xl font-extrabold">Settings</h1></div><div className="max-w-xl rounded-xl border border-border bg-card p-4"><form onSubmit={submit} className="space-y-3"><label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contact name<input name="contactName" required minLength={2} defaultValue={settings.data?.contactName || ""} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-xs" data-testid="input-settings-contact" /></label><label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Customer care<input name="customerCare" required minLength={5} defaultValue={settings.data?.customerCare || ""} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 font-mono-app text-xs" data-testid="input-settings-care" /></label><label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">M-Pesa till number<input name="tillNumber" required minLength={5} defaultValue={settings.data?.tillNumber || ""} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 font-mono-app text-xs" data-testid="input-settings-till" /></label>{(update.isError || settings.isError) && <p className="text-xs text-destructive" data-testid="status-settings-error">Settings could not be loaded or saved.</p>}{saved && <p className="inline-flex items-center gap-1 text-xs text-primary" data-testid="status-settings-saved"><Check className="h-3 w-3" />Saved</p>}<button disabled={update.isPending || settings.isLoading} className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground disabled:opacity-60" data-testid="button-save-settings">{update.isPending ? "Saving..." : "Save settings"}<ArrowRight className="h-3.5 w-3.5" /></button></form></div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/admin" component={Admin} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;