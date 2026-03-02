import { useState } from "react";
import { Link, useParams } from "wouter";
import { 
  ArrowLeft, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Download, 
  Share2, 
  MoreVertical,
  ZoomIn,
  ZoomOut,
  Maximize,
  Hand,
  PenTool,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DocumentView() {
  const params = useParams();
  const [zoom, setZoom] = useState(100);
  const [commentText, setCommentText] = useState("");

  const comments = [
    {
      id: 1,
      user: { name: "Alice Smith", initials: "AS", avatar: "https://i.pravatar.cc/150?u=1" },
      text: "Can we make the logo slightly larger here? It feels lost in the white space.",
      time: "2 hours ago",
      status: "open",
      position: { x: 25, y: 15 } // percentage
    },
    {
      id: 2,
      user: { name: "Charlie Brown", initials: "CB", avatar: "https://i.pravatar.cc/150?u=3" },
      text: "The copy has been updated per legal's request. Please verify.",
      time: "5 hours ago",
      status: "resolved",
      position: { x: 60, y: 45 }
    }
  ];

  return (
    <div className="flex h-screen w-full flex-col bg-background font-sans overflow-hidden">
      {/* Top Navbar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6 bg-card z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Q3 Marketing Campaign Assets.pdf
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-transparent font-normal">Pending Review</Badge>
            </h1>
            <p className="text-xs text-muted-foreground">v2.4 • Uploaded by Alice Smith today at 10:42 AM</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border-2 border-background -mr-3 z-30">
            <AvatarImage src="https://i.pravatar.cc/150?u=1" />
          </Avatar>
          <Avatar className="h-8 w-8 border-2 border-background -mr-3 z-20">
            <AvatarImage src="https://i.pravatar.cc/150?u=2" />
          </Avatar>
          <Avatar className="h-8 w-8 border-2 border-background z-10">
            <AvatarFallback className="bg-muted text-xs">+3</AvatarFallback>
          </Avatar>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          
          <div className="flex items-center gap-2 ml-2">
            <Button variant="destructive" size="sm">
              <XCircle className="mr-2 h-4 w-4" /> Request Changes
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="mr-2 h-4 w-4" /> Approve
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Document Viewer */}
        <div className="relative flex-1 bg-muted/30 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background border rounded-full shadow-md px-4 py-2 flex items-center gap-2 z-10">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setZoom(Math.max(25, zoom - 25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setZoom(Math.min(300, zoom + 25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-accent text-accent-foreground">
              <Hand className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <PenTool className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          {/* Canvas area (mock document) */}
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
            <div 
              className="relative bg-card shadow-lg border transition-all duration-200"
              style={{ 
                width: `${800 * (zoom/100)}px`, 
                height: `${1131 * (zoom/100)}px`,
                backgroundImage: 'linear-gradient(to right, #f8fafc 1px, transparent 1px), linear-gradient(to bottom, #f8fafc 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              {/* Document Mock Content */}
              <div className="p-16 w-full h-full" style={{ transform: `scale(${zoom/100})`, transformOrigin: 'top left' }}>
                <div className="h-32 w-48 bg-primary/20 rounded-md mb-8"></div>
                <h1 className="text-5xl font-bold mb-6 text-foreground tracking-tight">Q3 Marketing Strategy</h1>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-muted rounded"></div>
                  <div className="h-4 w-5/6 bg-muted rounded"></div>
                  <div className="h-4 w-4/5 bg-muted rounded"></div>
                </div>
                
                <div className="mt-12 grid grid-cols-2 gap-8">
                  <div className="h-64 bg-muted rounded-lg"></div>
                  <div className="space-y-4">
                    <div className="h-6 w-3/4 bg-primary/20 rounded"></div>
                    <div className="h-4 w-full bg-muted rounded"></div>
                    <div className="h-4 w-full bg-muted rounded"></div>
                    <div className="h-4 w-2/3 bg-muted rounded"></div>
                  </div>
                </div>
              </div>

              {/* Pin/Marker Mockups */}
              {comments.map(c => (
                <div 
                  key={c.id}
                  className={`absolute w-6 h-6 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs font-bold text-white shadow-md border-2 border-background cursor-pointer hover:scale-110 transition-transform ${c.status === 'resolved' ? 'bg-emerald-500' : 'bg-primary'}`}
                  style={{ top: `${c.position.y}%`, left: `${c.position.x}%` }}
                >
                  {c.id}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="w-80 flex-shrink-0 border-l bg-card flex flex-col">
          <Tabs defaultValue="comments" className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="comments">Comments (2)</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="comments" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className={`p-3 rounded-lg border text-sm ${comment.status === 'resolved' ? 'bg-muted/30 border-muted opacity-70' : 'bg-background border-border shadow-sm'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${comment.status === 'resolved' ? 'bg-emerald-500' : 'bg-primary'}`}>
                            {comment.id}
                          </div>
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={comment.user.avatar} />
                            <AvatarFallback>{comment.user.initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-foreground">{comment.user.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{comment.time}</span>
                      </div>
                      <p className="text-muted-foreground ml-7 leading-relaxed">
                        {comment.text}
                      </p>
                      
                      {comment.status === 'open' && (
                        <div className="ml-7 mt-3 flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs">Reply</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-emerald-600">
                            <CheckCircle className="mr-1 h-3 w-3" /> Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t bg-muted/10">
                <div className="relative">
                  <Textarea 
                    placeholder="Click anywhere on document to leave a comment..."
                    className="pr-10 resize-none h-20 text-sm focus-visible:ring-primary"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button 
                    size="icon" 
                    className="absolute bottom-2 right-2 h-6 w-6" 
                    disabled={!commentText.trim()}
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="flex-1 p-4 m-0 data-[state=inactive]:hidden">
              <div className="text-sm text-center text-muted-foreground mt-10">
                Activity history will appear here.
              </div>
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  );
}