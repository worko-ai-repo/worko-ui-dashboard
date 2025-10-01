import { useAppContext } from "@Context/App.context";
import CognitoServiceObj from "@Utils/Cognito.utils";
import React, { useEffect, useRef, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { toTitleCase } from "@Utils/Titlecase.utils";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { Send } from "lucide-react";
import httpServiceObj from "@Services/ApiHandler.service";

// handling dates
const formatDateLabel = (timestamp: number) => {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM dd, yyyy");
};

const formatTime = (timestamp: number) => {
  return format(new Date(timestamp), "p");
};

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  timestamp: number;
}

interface ReferralData {
  acceptedByUserId: string;
  id: string;
  userDetails?: {
    name: string;
    id:string;
  };
  employeeDetails?: {
    name: string;
  };
}

interface ChatWindowProps {
  onClose: () => void;
  show: boolean;
  referralData: ReferralData;
  user: string;
  candidateDetails?:string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  show,
  onClose,
  referralData,
  user,
  candidateDetails,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { userDetails } = useAppContext();
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // New ref to store previous scrollHeight when loading older messages
  const prevScrollHeightRef = useRef(0);
  const CHAT_API = import.meta.env.APP_CHAT_API_URI;
  const CHAT_SOCKET = import.meta.env.APP_CHAT_SOCKET_URI;
  // Animate
  useEffect(() => {
    if (show) {
      setMessages([]); // Clear old messages
      setLastKey(null);
      setLoadingMore(false);
      setVisible(true);
      const timer = setTimeout(() => setIsAnimatingIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

    const isUserNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const threshold = 100;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    );
  };

  // create chat and after that Connect WebSocket
  useEffect(() => {
    const createChat = async () =>{
      try {
        if (!referralData?.id || !referralData.acceptedByUserId || (!referralData?.userDetails?.id && !candidateDetails)) return;

          const url = `${CHAT_API}/chat/create`
          const payload = {
            referralId: referralData.id,
            userIdOne: referralData.acceptedByUserId,
            userIdTwo: referralData?.userDetails?.id || candidateDetails
          }

        const {response} = await httpServiceObj.post(url,payload,true,{},true)
        // console.log(response)
      } catch (error) {
        console.log(error)
      }
    }
    createChat()

    const connectWebSocket = async () => {
      // console.log("acceptedby :",referralData.acceptedByUserId)
      // console.log("candidate:",referralData?.userDetails?.id || candidateDetails)
      try {
        if (!referralData?.id || !referralData.acceptedByUserId) return;

        const token = CognitoServiceObj.getAccessToken();
        const wsUrl = `${CHAT_SOCKET}/?userId=${referralData.acceptedByUserId}&referralId=${referralData.id}&Authorization=Bearer%20${token}`;

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          const getMessagesPayload = {
            action: "getMessages",
            getMessagesData: {
              referralId: referralData.id,
              senderId: referralData.acceptedByUserId,
            },
          };
          socket.send(JSON.stringify(getMessagesPayload));
        };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);

          // Handle older messages (pagination)
          if (parsed.eventName === "getMessages" && Array.isArray(parsed.data)) {
            const container = messagesContainerRef.current;
            const prevScrollHeight = container?.scrollHeight || 0;

            const incomingMessages: Message[] = parsed.data.map((msg: any) => ({
              id: msg.id,
              text: msg.text,
              sender: msg.senderId === userDetails?.id ? "me" : "other",
              timestamp: new Date(msg.updatedAt || msg.createdAt || Date.now()).getTime(),
            }));

            setMessages((prev) => {
              const all = [...incomingMessages, ...prev];
              const deduped = Array.from(new Map(all.map((m) => [m.id, m])).values());
              deduped.sort((a, b) => a.timestamp - b.timestamp);
              return deduped;
            });

            setLastKey(parsed.pagination?.lastKey || null);
            setLoadingMore(false);

            // Restore scroll position after DOM updates
            requestAnimationFrame(() => {
              if (container) {
                const newScrollHeight = container.scrollHeight;
                const scrollOffset = newScrollHeight - prevScrollHeight;
                container.scrollTop = scrollOffset;
              }
            });
          }

          // Handle new incoming single message
          if (parsed.eventName === "sendMessage" && parsed.id && parsed.text) {
            const shouldScroll = isUserNearBottom();

            const incomingMessage: Message = {
              id: parsed.id,
              text: parsed.text,
              sender: parsed.senderId === userDetails?.id ? "me" : "other",
              timestamp: new Date(parsed.updatedAt || parsed.createdAt || Date.now()).getTime(),
            };

            setMessages((prev) => {
              if (prev.some((msg) => msg.id === incomingMessage.id)) return prev;
              const merged = [...prev, incomingMessage];
              merged.sort((a, b) => a.timestamp - b.timestamp);
              return merged;
            });

            if (shouldScroll) {
              requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              });
            }
          }
        } catch (err) {
          toast.error("Failed to parse incoming message", getToastOptions({}));
        }
      };


        socket.onerror = (error) => {
          toast.error("error connecting" + error, getToastOptions({}));
        };

        socket.onclose = (event) => {
          console.log("Connection closed", event.reason);
        };
      } catch (err) {
        console.log(err);
      }
    };

    if (show) {
      connectWebSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [show, referralData, userDetails?.id]);

  // Send new message handler
  const handleSend = () => {
    if (
      !newMessage.trim() ||
      !socketRef.current?.readyState ||
      socketRef.current.readyState !== WebSocket.OPEN
    )
      return;

    const msgPayload = {
      action: "sendMessage",
      sendMessageData: {
        text: newMessage,
        referralId: referralData.id,
        senderId: userDetails?.id,
      },
    };

    socketRef.current.send(JSON.stringify(msgPayload));
    setNewMessage("");
  };

  // Fetch older messages when scrolling to top
  useEffect(() => {
    if (!show) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    let isFetching = false;

    const handleScroll = () => {
      if (
        container.scrollTop <= 50 && // near the top
        lastKey &&
        !loadingMore &&
        !isFetching
      ) {
        isFetching = true;
        setLoadingMore(true);

        // Save current scroll height before fetching older messages
        prevScrollHeightRef.current = container.scrollHeight;

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          const getMessagesPayload = {
            action: "getMessages",
            getMessagesData: {
              referralId: referralData.id,
              senderId: referralData.acceptedByUserId,
              lastKey: lastKey,
            },
          };
          socketRef.current.send(JSON.stringify(getMessagesPayload));
        }
        setTimeout(() => {
          isFetching = false;
        }, 500); // debounce
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [lastKey, loadingMore, show, referralData]);


  // Preserve scroll position after prepending older messages
  useEffect(() => {
    if (!loadingMore) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const scrollOffset = newScrollHeight - prevScrollHeightRef.current;

        container.scrollTo({
          top: scrollOffset,
          behavior: "smooth",
        });
      });
    });
  }, [messages, loadingMore]);



  function renderGroupedMessages(messages: Message[]) {
    const grouped: { [date: string]: Message[] } = {};

    messages.forEach((msg) => {
      const dateLabel = formatDateLabel(msg.timestamp);
      if (!grouped[dateLabel]) grouped[dateLabel] = [];
      grouped[dateLabel].push(msg);
    });

    return Object.entries(grouped).map(([date, msgs]) => (
      <div key={date} className="space-y-2 mb-6">
        <div className="text-xs text-gray-500">{date}</div>
        {msgs.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "me" ? "justify-end text-end" : "justify-start text-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-lg text-sm relative min-w-[100px] max-w-[75%] ${
                msg.sender === "me" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.text}
              <div className="text-[10px] mt-1 text-right text-gray-800">
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    ));
  }

  {loadingMore && (
    <div className="text-center text-xs text-red-800 py-2">
      Loading earlier messages…
    </div>
  )}


  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}
    >
      <div
        className={`bg-white rounded-l-lg w-full max-w-xl min-h-screen max-h-screen transform transition-transform duration-300 ease-in-out ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-gray-700"
        >
          ×
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold p-6 pb-0 text-left bg-blue-500 text-white">{`Chatting with 
        ${toTitleCase(
          user === "employee"
            ? referralData?.userDetails?.name
            : referralData?.employeeDetails?.name
        )}`}</h2>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 pb-4 space-y-2 bg-gray-50"
        >
          <div className="chat-container">
            {loadingMore && (
              <div className="text-center text-sm text-gray-500 py-2">
                Loading earlier messages...
              </div>
            )}
            {renderGroupedMessages(messages)}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Typing and send section*/}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm transition flex items-center gap-1"
            >
              <Send size={16} />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
