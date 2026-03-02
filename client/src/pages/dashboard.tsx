import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  MoreHorizontal,
  ArrowUpRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock Data
const stats = [
  { name: 'Total Documents', value: '142', icon: FileText, change: '+12%', changeType: 'positive' },
  { name: 'Pending Review', value: '8', icon: Clock, change: 'Needs action', changeType: 'neutral' },
  { name: 'Approved (30d)', value: '64', icon: CheckCircle2, change: '+4.5%', changeType: 'positive' },
  { name: 'Rejected (30d)', value: '3', icon: XCircle, change: '-2%', changeType: 'positive' },
];

const recentDocuments = [
  { id: 1, title: 'Q3 Marketing Campaign Assets.pdf', project: 'Brand Refresh 2024', status: 'pending', date: '2 hours ago', owner: 'Alice Smith' },
  { id: 2, title: 'Website Homepage Copy_v3.docx', project: 'Website Redesign', status: 'approved', date: 'Yesterday', owner: 'Bob Jones' },
  { id: 3, title: 'Social Media Banners.zip', project: 'Social Strategy', status: 'changes_requested', date: '2 days ago', owner: 'Charlie Brown' },
  { id: 4, title: 'Legal Terms and Conditions.pdf', project: 'Compliance Updates', status: 'pending', date: '3 days ago', owner: 'Diana Prince' },
  { id: 5, title: 'Product UI Mockups.fig', project: 'App v2.0', status: 'approved', date: '4 days ago', owner: 'Evan Wright' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200">Pending Review</Badge>;
    case 'approved':
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 border-emerald-200">Approved</Badge>;
    case 'changes_requested':
      return <Badge variant="secondary" className="bg-rose-100 text-rose-800 hover:bg-rose-100/80 border-rose-200">Changes Requested</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Overview of your document proofs and approvals.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <Button variant="outline">View Reports</Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Proof
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="shadow-sm border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground">{stat.name}</div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <div className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</div>
                  <span className={`text-xs font-medium ${
                    stat.changeType === 'positive' ? 'text-emerald-600' : 
                    stat.changeType === 'negative' ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Documents List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Recent Documents</CardTitle>
                    <CardDescription>Documents requiring your attention or recently updated.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary" asChild>
                    <Link href="/documents">View all <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border/50">
                      <tr>
                        <th className="px-4 py-3 font-medium rounded-tl-md">Document</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Updated</th>
                        <th className="px-4 py-3 font-medium rounded-tr-md text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {recentDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{doc.title}</span>
                              <span className="text-xs text-muted-foreground">{doc.project} • {doc.owner}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(doc.status)}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {doc.date}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="secondary" size="sm" asChild>
                                <Link href={`/document/${doc.id}`}>Review</Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View Details</DropdownMenuItem>
                                  <DropdownMenuItem>Download</DropdownMenuItem>
                                  <DropdownMenuItem>Share Link</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <Card className="shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Action Required</CardTitle>
                <CardDescription>Items waiting for your approval.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Design Review</Badge>
                      <span className="text-xs text-muted-foreground">Today</span>
                    </div>
                    <h4 className="text-sm font-medium mb-1">Landing Page Hero Banner</h4>
                    <p className="text-xs text-muted-foreground mb-3">Requested by Alice S. • 2 versions</p>
                    <Button size="sm" className="w-full">Review Now</Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Invite your team</h3>
                  <p className="text-sm text-muted-foreground">Collaborate on proofs and streamline your approval process.</p>
                </div>
                <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5">Invite Members</Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}