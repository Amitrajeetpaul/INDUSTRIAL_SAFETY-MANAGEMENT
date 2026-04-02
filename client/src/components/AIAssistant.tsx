import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Bot, X, Send, User } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface ChatMessage {
    id: string;
    role: "user" | "ai";
    content: string;
}

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: "0", role: "ai", content: "Hello! I am the InduSafe AI Assistant. How can I help you with safety protocols or identification today?" }
    ]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const sendMessage = useMutation({
        mutationFn: async (messageText: string) => {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: messageText })
            });
            if (!res.ok) throw new Error("Failed to communicate with AI");
            return res.json();
        },
        onSuccess: (data) => {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: "ai", content: data.reply }]);
        }
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: userMessage }]);
        setInput("");
        sendMessage.mutate(userMessage);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    return (
        <div className="fixed bottom-6 left-6 z-50">
            {!isOpen ? (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="rounded-full w-14 h-14 shadow-2xl flex items-center justify-center bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all text-white border-2 border-white/20"
                >
                    <Bot className="w-6 h-6 animate-bounce" />
                </Button>
            ) : (
                <Card className="w-[350px] sm:w-[400px] h-[500px] flex flex-col shadow-2xl border-blue-600/20">
                    <CardHeader className="p-4 border-b bg-blue-600/5 flex flex-row items-center justify-between rounded-t-xl">
                        <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-400">
                            <Bot className="w-5 h-5" />
                            AI Safety Assistant
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full">
                            <X className="w-4 h-4" />
                        </Button>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 overflow-y-auto" ref={scrollRef}>
                        <div className="flex flex-col gap-4 p-4">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-blue-600 text-white shadow-sm'}`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl max-w-[80%] text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-white dark:bg-zinc-900 border border-border/50 rounded-tl-none whitespace-pre-wrap'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {sendMessage.isPending && (
                                <div className="flex gap-2 items-center text-muted-foreground text-sm p-2">
                                    <Bot className="w-4 h-4 animate-pulse" />
                                    Thinking...
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="p-3 border-t bg-muted/20">
                        <form onSubmit={handleSend} className="flex gap-2 w-full">
                            <Input
                                placeholder="Ask about safety protocols..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={sendMessage.isPending}
                                className="rounded-full shadow-sm bg-background border-border"
                            />
                            <Button type="submit" size="icon" className="rounded-full shrink-0 shadow-sm" disabled={!input.trim() || sendMessage.isPending}>
                                <Send className="w-4 h-4 ml-0.5" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
