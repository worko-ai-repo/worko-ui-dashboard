import { useAppContext } from "@Context/App.context";
import CognitoServiceObj from "@Utils/Cognito.utils";
import React, { useEffect, useRef, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { toTitleCase } from "@Utils/Titlecase.utils";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";

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
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  show,
  onClose,
  referralData,
  user,
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

  // Animate
  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setIsAnimatingIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Connect WebSocket
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        if (!referralData?.id || !referralData.acceptedByUserId) return;

        const token = CognitoServiceObj.getAccessToken();
        const wsUrl = `wss://chatws.dev.worko.work/?userId=${referralData.acceptedByUserId}&referralId=${referralData.id}&Authorization=Bearer%20${token}`;

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
          // console.log('getMessages', getMessagesPayload);
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (
              parsed.eventName === "getMessages" &&
              Array.isArray(parsed.data)
            ) {
              const incomingMessages: Message[] = parsed.data.map(
                (msg: any) => ({
                  id: msg.id,
                  text: msg.text,
                  sender: msg.senderId === userDetails?.id ? "me" : "other",
                  timestamp: new Date(
                    msg.updatedAt || msg.createdAt || Date.now()
                  ).getTime(),
                })
              );

              setMessages((prev) =>
                loadingMore
                  ? [...incomingMessages.reverse(), ...prev]
                  : incomingMessages.reverse()
              );
              setLastKey(parsed.pagination?.lastKey || null);
              setLoadingMore(false);
            }

            if (
              parsed.eventName === "sendMessage" &&
              parsed.id &&
              parsed.text
            ) {
              const incomingMessage: Message = {
                id: parsed.id,
                text: parsed.text,
                sender: parsed.senderId === userDetails?.id ? "me" : "other",
                timestamp: new Date(
                  parsed.updatedAt || parsed.createdAt || Date.now()
                ).getTime(),
              };

              setMessages((prev) => [...prev, incomingMessage]);
            }
          } catch (err) {
            toast.error("Failed to get incoming message:",getToastOptions({}));
          }
        };

        socket.onerror = (error) => {
          toast.error("error connecting" + error,getToastOptions({}));
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
  }, [show, referralData]);

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
    // console.log('message sent', msgPayload);
    setNewMessage("");
  };

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
                msg.sender === "me"
                ? "justify-end text-end"
                : "justify-start text-start"
            }`}
            >
            <div
                className={`px-4 py-2 rounded-lg text-sm relative 
                min-w-[100px] max-w-[75%] 
                ${
                msg.sender === "me"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
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
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold p-6 pb-0 text-left">{`Chatting with 
        ${toTitleCase(
          user === "employee"
            ? referralData?.userDetails?.name
            : referralData?.employeeDetails?.name
        )}`}</h2>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2 bg-gray-50">
            <div className="chat-container">
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
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm transition"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
