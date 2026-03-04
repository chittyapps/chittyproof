import { Link, useParams } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  CheckCircle2,
  FileJson,
  Hash,
  KeyRound,
  ShieldCheck,
  Terminal,
  Clock
} from "lucide-react";

export default function PayloadView() {
  const params = useParams();
  const id = params.id || 'fact_8f72a1b2';

  // Mock canonicalized JSON
  const canonicalJson = `{
  "context": "https://chittyos.org/schema/v2/fact",
  "id": "${id}",
  "issuer": "did:web:chittyos.org",
  "subject": {
    "score": 84.500000000001,
    "type": "PerformanceMetric"
  },
  "timestamp": "2026-03-04T14:32:01Z",
  "type": [
    "VerifiableCredential",
    "FactBundle"
  ]
}`;

  return (
    <AppLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-[90rem] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:bg-accent">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">{id}</h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono text-[10px] uppercase">Signature Verified</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground font-mono flex items-center">
              <Clock className="mr-1.5 h-3 w-3" />
              Processed 2 mins ago • FACT v2 Bundle
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Inspection Area */}
          <div className="lg:col-span-2 space-y-6">
            
            <Card className="bg-card/50 backdrop-blur border-border/50 shadow-none overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50 py-3 px-5 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center font-mono">
                  <Terminal className="h-4 w-4 mr-2 text-primary" />
                  Canonicalized Payload
                </CardTitle>
                <div className="text-[10px] text-muted-foreground font-mono bg-background px-2 py-1 rounded border border-border/50">
                  null-stripped • -0 normalized • keys sorted
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-background/50 p-5 overflow-x-auto">
                  <pre className="text-xs font-mono text-muted-foreground leading-relaxed">
                    <code className="text-primary/90">{canonicalJson}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-card/50 backdrop-blur border-border/50 shadow-none">
                <CardHeader className="py-4 px-5 border-b border-border/50">
                  <CardTitle className="text-xs font-mono text-muted-foreground uppercase flex items-center">
                    <Hash className="h-3 w-3 mr-2 text-primary" />
                    SHA-256 Hash
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-xs font-mono text-foreground break-all bg-muted/30 p-3 rounded border border-border/50">
                    sha256:4a1d8c9f2b3e5d7a6c8b9d0e1f2a3c4b5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50 shadow-none">
                <CardHeader className="py-4 px-5 border-b border-border/50">
                  <CardTitle className="text-xs font-mono text-muted-foreground uppercase flex items-center">
                    <ShieldCheck className="h-3 w-3 mr-2 text-primary" />
                    Signature (ECDSA P-256)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <p className="text-xs font-mono text-muted-foreground break-all line-clamp-3 bg-muted/30 p-3 rounded border border-border/50">
                    MEUCIQDK9aB1bC2...dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2xY3z
                  </p>
                </CardContent>
              </Card>
            </div>
            
          </div>

          {/* Validation Sidebar */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur border-border/50 shadow-none">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-semibold">Integrity Checks</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50 font-mono text-xs">
                  <div className="p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-foreground">Schema Validation</div>
                      <div className="text-[10px] text-muted-foreground mt-1">Strict FACT v2 (11 pillars present)</div>
                    </div>
                  </div>
                  <div className="p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-foreground">Canonicalization</div>
                      <div className="text-[10px] text-muted-foreground mt-1">Deterministic JSON generated</div>
                    </div>
                  </div>
                  <div className="p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-foreground">Hash Verification</div>
                      <div className="text-[10px] text-muted-foreground mt-1">Matches payload digest</div>
                    </div>
                  </div>
                  <div className="p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-foreground">JWKS Resolution</div>
                      <div className="text-[10px] text-muted-foreground mt-1">Key resolved from local KV cache</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50 shadow-none">
              <CardHeader className="py-3 px-4 border-b border-border/50">
                <CardTitle className="text-xs font-mono text-muted-foreground uppercase flex items-center">
                  <KeyRound className="h-3 w-3 mr-2" />
                  Resolved Public Key
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">kid</span>
                    <span className="text-foreground">key-2026-01</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">kty</span>
                    <span className="text-foreground">EC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">crv</span>
                    <span className="text-foreground">P-256</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}