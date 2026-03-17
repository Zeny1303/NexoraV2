"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full bg-black">

      {/* ───────── LEFT SIDE (SAME AS SIGN-IN) ───────── */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">

        {/* Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.25),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(99,102,241,0.2),transparent_40%),#000]" />

        {/* Glow */}
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
            Join thousands of students discovering events and opportunities across India.
          </p>

        </div>
      </div>


      {/* ───────── RIGHT SIDE (SIGNUP) ───────── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-black">

        <div className="w-[380px] transition-transform duration-300 hover:scale-[1.02]">

          <SignUp
            appearance={{
              elements: {

                // CARD
                card:
                  "bg-[#0b0b15]/90 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] rounded-2xl border border-white/10",

                // TEXT
                headerTitle:
                  "text-white text-2xl font-semibold",

                headerSubtitle:
                  "text-gray-400",

                // INPUT
                formFieldInput:
                  "bg-[#141424] border border-white/10 text-white",

                formFieldLabel:
                  "text-gray-300",

                // BUTTON
                formButtonPrimary:
                  "bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 text-white hover:opacity-90 transition-all",

                // GOOGLE BUTTON
                socialButtonsBlockButton:
                  "bg-[#141424] border border-white/10 text-white hover:bg-white/10",

                // FOOTER
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