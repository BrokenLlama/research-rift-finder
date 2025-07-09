
import { useState } from "react";
import { groq } from "../groq";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Msg = { role: "user" | "assistant"; content: string };

export function GroqChatDemo() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Msg = { role: "user", content: input };
    setChat(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    try {
      const stream = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        messages: [...chat, userMsg].map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_completion_tokens: 512,
        stream: true,
      });

      let assistant: Msg = { role: "assistant", content: "" };
      setChat(prev => [...prev, assistant]);

      for await (const chunk of stream) {
        const delta = chunk.choices[0].delta.content || "";
        assistant.content += delta;
        setChat(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = assistant;
          return copy;
        });
      }
    } catch (error) {
      console.error('Groq API error:', error);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Groq Chat Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 mb-4 p-4 border rounded">
          <div className="space-y-2">
            {chat.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <p className={`inline-block p-2 rounded max-w-[80%] ${
                  m.role === "user" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-900"
                }`}>
                  <strong>{m.role}:</strong> {m.content}
                </p>
              </div>
            ))}
            {streaming && <p className="text-gray-500"><em>...typing</em></p>}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            className="flex-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message..."
          />
          <Button onClick={send} disabled={streaming}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
