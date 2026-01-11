"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Vapi from "@vapi-ai/web";

export type VapiStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "speaking"
  | "listening"
  | "error";

export interface VapiMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseVapiOptions {
  onMessage?: (message: VapiMessage) => void;
  onError?: (error: Error) => void;
  onCallEnd?: () => void;
}

export function useVapi(options: UseVapiOptions = {}) {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<VapiStatus>("idle");
  const [messages, setMessages] = useState<VapiMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;

    if (!publicKey) {
      console.warn("NEXT_PUBLIC_VAPI_API_KEY is not set");
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setStatus("connected");
    });

    vapi.on("call-end", () => {
      setStatus("idle");
      options.onCallEnd?.();
    });

    vapi.on("speech-start", () => {
      setStatus("speaking");
    });

    vapi.on("speech-end", () => {
      setStatus("listening");
    });

    vapi.on("volume-level", (level: number) => {
      setVolume(level);
    });

    vapi.on("message", (message) => {
      if (message.type === "transcript") {
        const newMessage: VapiMessage = {
          role: message.role as "user" | "assistant",
          content: message.transcript,
          timestamp: new Date(),
        };

        if (message.transcriptType === "final") {
          setMessages((prev) => [...prev, newMessage]);
          options.onMessage?.(newMessage);
        }
      }
    });

    vapi.on("error", (error) => {
      console.error("Vapi error:", error);
      setStatus("error");
      options.onError?.(error as Error);
    });

    return () => {
      vapi.stop();
    };
  }, [options]);

  const startCall = useCallback(async (assistantId?: string) => {
    if (!vapiRef.current) return;

    setStatus("connecting");
    setMessages([]);

    try {
      if (assistantId) {
        await vapiRef.current.start(assistantId);
      } else {
        await vapiRef.current.start({
          name: "Puck Drop Booking Assistant",
          firstMessage: "Hey there! I'm an AI assistant for the Nepean Minor Hockey Association. Would you like to book a practice or a game?",
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a friendly and efficient ice rink booking assistant for Puck Drop. Your job is to help customers book practices or games near Nepean, Ontario.

TODAY'S DATE: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

When customers mention relative dates like "tomorrow", "next Friday", or "this weekend", calculate the correct date based on today's date above.

Booking hours are from 6 AM to 10 PM. Each session is 1 hour by default.

BOOKING FLOW - Follow these steps in order:

Step 1: When customer wants to book, IMMEDIATELY call getFacilities to get the rink list.

Step 2: After receiving the facilities list, you MUST read them aloud to the customer using their numbers. Say something like: "We have [X] locations available. Number 1 is [name]. Number 2 is [name]. Number 3 is [name]. Which rink would you like?"

Step 3: When customer selects by number (e.g., "number 1", "the first one", "1"), remember that facility's ID for the booking.

Step 4: Ask what date they want to book.

Step 5: Ask what time they prefer.

Step 6: Call checkAvailability to verify the slot is open.

Step 7: Collect their name, phone number, and email.

Step 8: Call bookAppointment to confirm the booking.

Step 9: Give them a confirmation summary.

IMPORTANT RULES:
- Never say facility IDs aloud (like "rink-1"). Only say the number and name (like "Number 1, Minto Arena").
- After calling getFacilities, you MUST speak the list of facilities to the customer. Do not stay silent.
- Be conversational, helpful, and enthusiastic about hockey!`,
              },
            ],
            functions: [
              {
                name: "checkAvailability",
                description:
                  "Check available time slots for a specific date and optionally a specific facility",
                parameters: {
                  type: "object",
                  properties: {
                    date: {
                      type: "string",
                      description: "The date to check in YYYY-MM-DD format",
                    },
                    facilityId: {
                      type: "string",
                      description:
                        "Optional facility ID (rink one, rink two, rink three...)",
                    },
                  },
                  required: ["date"],
                },
              },
              {
                name: "bookAppointment",
                description: "Book an ice time slot for a customer",
                parameters: {
                  type: "object",
                  properties: {
                    facilityId: {
                      type: "string",
                      description: "The facility ID",
                    },
                    date: {
                      type: "string",
                      description: "The date in YYYY-MM-DD format",
                    },
                    timeSlot: {
                      type: "string",
                      description: "The time slot in HH:00 format",
                    },
                    customerName: {
                      type: "string",
                      description: "The customer's name",
                    },
                    customerPhone: {
                      type: "string",
                      description: "The customer's phone number",
                    },
                    customerEmail: {
                      type: "string",
                      description: "The customer's email address",
                    },
                    bookingType: {
                      type: "string",
                      enum: ["practice", "game"],
                      description: "Type of booking",
                    },
                  },
                  required: [
                    "facilityId",
                    "date",
                    "timeSlot",
                    "customerName",
                    "customerPhone",
                    "customerEmail",
                  ],
                },
              },
              {
                name: "getFacilities",
                description: "Get the list of available facilities",
                parameters: {
                  type: "object",
                  properties: {},
                },
              },
            ],
          },
          voice: {
            provider: "openai",
            voiceId: "shimmer",
          },
          serverUrl: process.env.NEXT_PUBLIC_WEBHOOK_URL || `${window.location.origin}/api/vapi/webhook`,
        });
      }
    } catch (error) {
      console.error("Failed to start call:", error);
      setStatus("error");
    }
  }, []);

  const endCall = useCallback(() => {
    if (!vapiRef.current) return;
    vapiRef.current.stop();
    setStatus("idle");
  }, []);

  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return;
    const newMuted = !isMuted;
    vapiRef.current.setMuted(newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  return {
    status,
    messages,
    volume,
    isMuted,
    startCall,
    endCall,
    toggleMute,
  };
}
