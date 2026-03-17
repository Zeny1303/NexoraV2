"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full bg-black">

<div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">

  {/* Smooth gradient */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.25),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(99,102,241,0.2),transparent_40%),#000]" />

  {/* Soft glow */}
  <div className="absolute w-[600px] h-[600px] bg-purple-600/20 blur-[140px]" />

  {/* Content */}
  <div className="relative z-10 text-center px-12">

    <div className="flex flex-col items-center mb-8">
      <Image
        src="/assets/images/logo.png"
        alt="Nexora Logo"
        width={90}
        height={90}
        className="drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]"
      />

      <h1 className="text-5xl font-semibold text-white mt-6 tracking-tight">
        Nexora
      </h1>
    </div>

    <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
      Discover events, connect with colleges, and explore opportunities across India.
    </p>

  </div>
</div>

      {/* RIGHT SIDE */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-black">

        <div className="w-[380px]">

          <SignIn
            appearance={{
              elements: {

                card:
                  "bg-[#0b0b15] shadow-[0_20px_60px_rgba(0,0,0,0.7)] rounded-2xl border border-white/10",

                headerTitle:
                  "text-white text-2xl font-semibold",

                headerSubtitle:
                  "text-gray-400",

                formFieldInput:
                  "bg-[#141424] border border-white/10 text-white",

                formFieldLabel:
                  "text-gray-300",

                formButtonPrimary:
                  "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:opacity-90",

                socialButtonsBlockButton:
                  "bg-[#141424] border border-white/10 text-white hover:bg-white/10",

                footerActionText: "text-gray-400",
                footerActionLink: "text-purple-400",
              },
            }}
          />

        </div>
      </div>

    </div>
  );
}