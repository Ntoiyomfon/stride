"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const tabs = [
    {
        id: "organize",
        label: "Organize Applications",
        image: "/hero-images/hero1.png",
        alt: "Organize Applications",
    },
    {
        id: "getHired",
        label: "Get Hired",
        image: "/hero-images/hero2.png",
        alt: "Get Hired",
    },
    {
        id: "manageBoards",
        label: "Manage Boards",
        image: "/hero-images/hero3.png",
        alt: "Manage Boards",
    },
];

export default function ImageTab() {
    const [activeTab, setActiveTab] = useState("organize");

    return (
        <section className="bg-white py-16">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-6xl">
                    {/* Tabs */}
                    <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-4 mb-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative rounded-lg px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors w-full md:w-auto outline-none",
                                    activeTab === tab.id ? "text-white" : "text-gray-600 hover:text-black"
                                )}
                            >
                                {/* Active Tab Background Animation */}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-primary rounded-lg"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                {/* Tab Label (relative z-10 to stay on top of the background) */}
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Image Content Animation */}
                    <div className="relative mx-auto max-w-5xl aspect-[3/2] overflow-hidden rounded-lg border-gray-200 shadow-xl bg-gray-100">
                        <AnimatePresence mode="wait" initial={false}>
                            {tabs.map(
                                (tab) =>
                                    activeTab === tab.id && (
                                        <motion.div
                                            key={tab.id}
                                            initial={{ opacity: 0, x: 20, scale: 0.98 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -20, scale: 0.98 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="absolute inset-0"
                                        >
                                            <Image
                                                src={tab.image}
                                                alt={tab.alt}
                                                fill
                                                className="object-cover"
                                                priority
                                            />
                                        </motion.div>
                                    )
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}