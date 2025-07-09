
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatHistoryEntry {
  id: string;
  list_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export const useChatHistory = (listId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatHistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChatHistory();
    }
  }, [user, listId]);

  const fetchChatHistory = async () => {
    try {
      let query = supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (listId) {
        query = query.eq('list_id', listId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our interface with proper type checking
      const transformedData: ChatHistoryEntry[] = (data || []).map(item => ({
        id: item.id,
        list_id: item.list_id,
        title: item.title,
        messages: Array.isArray(item.messages) 
          ? (item.messages as unknown as ChatMessage[]).filter(msg => 
              msg && typeof msg === 'object' && 'role' in msg && 'content' in msg
            )
          : [],
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      
      setChatHistory(transformedData);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async (listId: string, title: string = 'New Chat') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          list_id: listId,
          title,
          messages: [],
        })
        .select()
        .single();

      if (error) throw error;
      
      const newChat: ChatHistoryEntry = {
        id: data.id,
        list_id: data.list_id,
        title: data.title,
        messages: Array.isArray(data.messages) 
          ? (data.messages as unknown as ChatMessage[]).filter(msg => 
              msg && typeof msg === 'object' && 'role' in msg && 'content' in msg
            )
          : [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      setCurrentChat(newChat);
      await fetchChatHistory();
      return newChat;
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateChatMessages = async (chatId: string, messages: ChatMessage[]) => {
    try {
      const { error } = await supabase
        .from('chat_history')
        .update({ 
          messages: messages as unknown as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) throw error;
      
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat({ ...currentChat, messages });
      }
    } catch (error) {
      console.error('Error updating chat messages:', error);
    }
  };

  const loadChat = (chat: ChatHistoryEntry) => {
    setCurrentChat(chat);
  };

  const deleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', chatId);

      if (error) throw error;
      
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat(null);
      }
      await fetchChatHistory();
      
      toast({
        title: "Success",
        description: "Chat deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat.",
        variant: "destructive",
      });
    }
  };

  return {
    chatHistory,
    currentChat,
    loading,
    createNewChat,
    updateChatMessages,
    loadChat,
    deleteChat,
    refreshHistory: fetchChatHistory,
  };
};
