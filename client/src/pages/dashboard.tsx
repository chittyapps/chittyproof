import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Database, 
  KeyRound, 
  Activity,
  ArrowUpRight,
  Hash,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

// Mock Data
const stats = [
  { name: 'Payloads Canonicalized', value: '1.24M', icon: Database, change: '+12k today', changeType: 'positive' },
  { name: 'Signatures Verified', value: '984K', icon: ShieldCheck, change: '99.9% Success', changeType: 'positive' },
  { name: 'Active JWKS Cached', value: '42', icon: KeyRound, change: 'Refreshed 2m ago', changeType: 'neutral' },
  { name: 'Current Epsilon Guard', value: '0.00001', icon: Activity, change: 'Half-up rounding active', changeType: 'neutral' },
];

const recentBundles = [
  { id: 'fact_8f72...a1b2', hash: 'sha256:4a1d8c...', status: 'verified', timestamp: 'Just now', type: 'Score Fact' },
  { id: 'fact_9c34...d5e6', hash: 'sha256:7b2e9f...', status: 'verified', timestamp: '2 mins ago', type: 'Identity Proof' },
  { id: 'fact_2a1b...c3d4', hash: 'sha256:1c4f5a...', status: 'failed', timestamp: '15 mins ago', type: 'Score Fact', error: 'Invalid ECDSA' },
  { id: 'fact_5e6f...7a8b', hash: 'sha256:9d3e2c...', status: 'verified', timestamp: '1 hour ago', type: 'System Audit' },
  { id: 'fact_1b2c...3d4e', hash: 'sha256:8f1a2b...', status: 'verified', timestamp: '2 hours ago', type: 'Score Fact' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'verified':
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono text-[10px] uppercase">Verified</Badge>;
    case 'failed':
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 font-mono text-[10px] uppercase">Failed</Badge>;
    default:
      return <Badge variant="outline" className="font-mono text-[10px] uppercase">Pending</Badge>;
  }
};

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-[90rem] mx-auto space-y-8">
        
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Integrity Hub</h1>
            <p className="mt-1 text-sm text-muted-foreground font-mono">
              Tier 0 Trust Anchor • v1.0.0 (Strict FACT v2)
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <Button variant="outline" className="border-border bg-card hover:bg-accent font-mono text-xs">
              <Hash className="mr-2 h-3.5 w-3.5" />
              Manual Verify
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="bg-card/50 backdrop-blur border-border/50 shadow-none hover:border-primary/20 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{stat.name}</div>
                  <div className="p-1.5 bg-primary/10 rounded border border-primary/20">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <div className="text-2xl font-semibold tracking-tight text-foreground">{stat.value}</div>
                  <span className={`text-[10px] font-mono ${
                    stat.changeType === 'positive' ? 'text-primary' : 
                    stat.changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Verifications */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/50 backdrop-blur border-border/50 shadow-none">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">FACT v2 Processing Stream</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">Live feed of cryptographic verifications.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 font-mono text-xs" asChild>
                    <Link href="/bundles">View Full Log <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] font-mono text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
                      <tr>
                        <th className="px-5 py-3 font-medium">Bundle ID</th>
                        <th className="px-5 py-3 font-medium">Canonical Hash (SHA-256)</th>
                        <th className="px-5 py-3 font-medium">Type</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 font-mono text-xs">
                      {recentBundles.map((doc, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => window.location.href = `/payload/${doc.id}`}>
                          <td className="px-5 py-3 text-foreground font-medium">
                            {doc.id}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground truncate max-w-[150px]">
                            {doc.hash}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {doc.type}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(doc.status)}
                              {doc.error && <span className="text-[10px] text-destructive">{doc.error}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground text-right">
                            {doc.timestamp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health / Status */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur border-border/50 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Deterministic JSON Canon</span>
                    <span className="text-primary flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> OK</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">P-256 ECDSA Verifier</span>
                    <span className="text-primary flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> OK</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">JWKS Resolution Cache</span>
                    <span className="text-primary flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> OK</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Orphaned Keys</span>
                    <span className="text-amber-500 flex items-center"><AlertTriangle className="h-3 w-3 mr-1"/> 2 Detected</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20 shadow-none overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="h-24 w-24" />
              </div>
              <CardContent className="p-6 relative z-10 space-y-3">
                <h3 className="font-semibold text-sm">ChittyProof v1.0.0 Active</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                  Tier 0 infrastructure is currently enforcing strict FACT v2 bundle schema constraints (11 required pillars, additionalProperties: false).
                </p>
                <Button variant="outline" size="sm" className="w-full bg-background border-primary/20 text-primary hover:bg-primary/10 mt-2 font-mono text-[10px] uppercase">
                  View Architecture Docs
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}