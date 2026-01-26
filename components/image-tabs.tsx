"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { useState } from "react";

export default function ImageTab() {
    const [activeTab, setActiveTab] = useState("organize");
    return (
        <section className="border-t bg-white py-16">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-6xl">
                {/* Tabs */}
                <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-4 mb-8">
                    <Button onClick={() => setActiveTab("organize")}
                    className={`rounded-lg px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors w-full md:w-auto ${activeTab === "organize" ? "bg-primary text-white" : "bg-gray-200 text-black hover:text-white"}`}
                    >Organize Applications</Button>
                    <Button onClick={() => setActiveTab("getHired")}
                    className={`rounded-lg px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors w-full md:w-auto ${activeTab === "getHired" ? "bg-primary text-white" : "bg-gray-200 text-black hover:text-white"}`}
                    >Get Hired</Button>
                    <Button onClick={() => setActiveTab("manageBoards")}
                    className={`rounded-lg px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors w-full md:w-auto ${activeTab === "manageBoards" ? "bg-primary text-white" : "bg-gray-200 text-black hover:text-white"}`}
                    >Manage Boards</Button>
                </div>
                <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border-gray-200 shadow-xl">
                    {activeTab === "organize" && (
                    <Image 
                        src="/hero-images/hero1.png"
                        alt="Organize Applications"
                        width={1200}
                        height={800}
                    />
                    )}
                    {activeTab === "getHired" && (
                    <Image 
                        src="/hero-images/hero2.png"
                        alt="Get Hired"
                        width={1200}
                        height={800}
                    />
                    )}
                    {activeTab === "manageBoards" && (
                    <Image 
                        src="/hero-images/hero3.png"
                        alt="Manage Boards"
                        width={1200}
                        height={800}
                    />
                    )}
                </div>
                </div>
            </div>
            </section>
        )
}