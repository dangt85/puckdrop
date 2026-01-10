"use client";

import { Button } from "@/components/ui/button";
import { VoiceBooking } from "@/components/vapi/VoiceBooking";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]" />

      <div className="container relative mx-auto px-4 py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            Voice-Powered Booking
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Book Ice Time with{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Voice
            </span>
          </h1>

          <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
            Skip the phone queues and online forms. Just speak naturally to book your
            ice time, hockey lessons, or team events. Our AI assistant handles everything
            24/7, so you can focus on the game.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <VoiceBooking />
            <Button variant="outline" size="lg" className="min-w-[200px] text-base">
              Watch Demo
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-primary" />
              <span>No app required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-primary" />
              <span>Instant confirmation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-primary" />
              <span>24/7 available</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </section>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
