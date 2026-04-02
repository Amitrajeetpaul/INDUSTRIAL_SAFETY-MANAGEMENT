import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Message } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export function ChatPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: messages = [] } = useQuery<Message[]>({
        queryKey: [api.messages.list.path],
        queryFn: async () => {
            const res = await fetch(api.messages.list.path);
            if (!res.ok) throw new Error("Failed to fetch messages");
            return res.json();
        },
        // Only poll when the user is logged in
        refetchInterval: (query) => {
            const hasUser = !!user;
            return (isOpen && hasUser) ? 3000 : false;
        }
    });

    const sendMessage = useMutation({
        mutationFn: async (content: string) => {
            const res = await fetch(api.messages.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            if (!res.ok) throw new Error("Failed to send");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
            setContent("");
        },
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        sendMessage.mutate(content);
    };

    if (!user) return null;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative group hover:border-primary/50 transition-colors">
                    <MessageCircle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {messages.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 border-l border-border/40 shadow-2xl">
                <SheetHeader className="pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <MessageCircle className="w-5 h-5 text-primary" />
                        </div>
                        Safety Chat & Alerts
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-4" ref={scrollRef}>
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">No messages yet.</p>
                            <p className="text-xs">Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.userId === user?.id;
                            // We could join with users table in a real app to get names, 
                            // but for now we'll just check if it's the current user
                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] rounded-xl px-4 py-2.5 shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-white dark:bg-zinc-900 border border-border/50 rounded-bl-none text-foreground'}`}>
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1.5 px-1 font-medium">
                                        {isMe ? 'You' : `User #${msg.userId}`} • {msg.createdAt ? format(new Date(msg.createdAt), "HH:mm") : '...'}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                <form onSubmit={handleSend} className="pt-4 border-t flex gap-2 bg-background">
                    <Input
                        placeholder="Type a message or alert..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={sendMessage.isPending}
                        className="flex-1 rounded-full px-4 bg-muted/50 focus-visible:ring-1"
                    />
                    <Button type="submit" size="icon" className="rounded-full shadow-sm" disabled={sendMessage.isPending || !content.trim()}>
                        <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
