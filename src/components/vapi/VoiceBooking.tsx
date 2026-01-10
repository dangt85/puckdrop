"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVapi, VapiMessage, VapiStatus } from "@/hooks/useVapi";
import { cn } from "@/lib/utils";

interface VoiceBookingProps {
  assistantId?: string;
  className?: string;
}

export function VoiceBooking({ assistantId, className }: VoiceBookingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { status, messages, volume, isMuted, startCall, endCall, toggleMute } =
    useVapi({
      onCallEnd: () => {
        // Keep the modal open to show the conversation summary
      },
    });

  const handleStartCall = async () => {
    setIsOpen(true);
    await startCall(assistantId);
  };

  const handleEndCall = () => {
    endCall();
  };

  const handleClose = () => {
    if (status !== "idle") {
      endCall();
    }
    setIsOpen(false);
  };

  return (
    <>
      <Button
        size="lg"
        onClick={handleStartCall}
        className="min-w-[200px] text-base"
      >
        <MicrophoneIcon className="mr-2 h-5 w-5" />
        Try Voice Booking
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card
            className={cn(
              "w-full max-w-md animate-in fade-in zoom-in duration-200",
              className
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl">Voice Booking</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <CloseIcon className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <StatusIndicator status={status} volume={volume} />

              <div className="h-64 overflow-y-auto rounded-lg bg-muted/50 p-4">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    {status === "idle"
                      ? "Click the microphone to start booking"
                      : status === "connecting"
                        ? "Connecting..."
                        : "Listening..."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message, index) => (
                      <MessageBubble key={index} message={message} />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4">
                {status === "idle" ? (
                  <Button
                    size="lg"
                    onClick={() => startCall(assistantId)}
                    className="h-16 w-16 rounded-full"
                  >
                    <MicrophoneIcon className="h-6 w-6" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleMute}
                      className="h-12 w-12 rounded-full"
                    >
                      {isMuted ? (
                        <MicrophoneOffIcon className="h-5 w-5" />
                      ) : (
                        <MicrophoneIcon className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={handleEndCall}
                      className="h-16 w-16 rounded-full"
                    >
                      <PhoneOffIcon className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                {status === "idle"
                  ? "Press the microphone to start"
                  : status === "connecting"
                    ? "Connecting to assistant..."
                    : status === "speaking"
                      ? "Assistant is speaking..."
                      : status === "listening"
                        ? "Listening to you..."
                        : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function StatusIndicator({
  status,
  volume,
}: {
  status: VapiStatus;
  volume: number;
}) {
  const isActive = status !== "idle" && status !== "error";

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={cn(
          "relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300",
          status === "idle" && "bg-muted",
          status === "connecting" && "bg-primary/20 animate-pulse",
          status === "connected" && "bg-primary/30",
          status === "listening" && "bg-green-500/30",
          status === "speaking" && "bg-blue-500/30",
          status === "error" && "bg-destructive/30"
        )}
      >
        {isActive && (
          <div
            className="absolute inset-0 rounded-full bg-primary/20 transition-transform duration-100"
            style={{
              transform: `scale(${1 + volume * 0.5})`,
              opacity: volume,
            }}
          />
        )}
        <div
          className={cn(
            "relative z-10 h-12 w-12 rounded-full transition-colors",
            status === "idle" && "bg-muted-foreground/20",
            status === "connecting" && "bg-primary animate-pulse",
            status === "connected" && "bg-primary",
            status === "listening" && "bg-green-500",
            status === "speaking" && "bg-blue-500",
            status === "error" && "bg-destructive"
          )}
        />
      </div>
      <span
        className={cn(
          "text-sm font-medium",
          status === "listening" && "text-green-600",
          status === "speaking" && "text-blue-600"
        )}
      >
        {status === "listening" && "Listening"}
        {status === "speaking" && "Speaking"}
        {status === "connecting" && "Connecting"}
        {status === "connected" && "Connected"}
        {status === "idle" && "Ready"}
        {status === "error" && "Error"}
      </span>
    </div>
  );
}

function MessageBubble({ message }: { message: VapiMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicrophoneOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function PhoneOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="22" x2="2" y1="2" y2="22" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  );
}
