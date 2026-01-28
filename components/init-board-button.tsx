"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function InitBoardButton() {
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleInitBoard = async () => {
    setLoading(true);
    setResult("");
    
    try {
      const response = await fetch('/api/debug/init-board', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Board initialized successfully! Board ID: ${data.board?.id}`);
      } else {
        setResult(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    setProfileLoading(true);
    setResult("");
    
    try {
      const response = await fetch('/api/debug/create-profile', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Profile created successfully! User ID: ${data.userId}`);
        // Refresh the page to update the UI
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setResult(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProfileLoading(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 bg-blue-600 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Tools</h3>
      <Button 
        onClick={handleCreateProfile} 
        disabled={profileLoading}
        size="sm"
        className="mb-2 w-full bg-green-600 hover:bg-green-700"
      >
        {profileLoading ? 'Creating...' : 'Create Profile'}
      </Button>
      <Button 
        onClick={handleInitBoard} 
        disabled={loading}
        size="sm"
        className="mb-2 w-full"
      >
        {loading ? 'Initializing...' : 'Initialize Board'}
      </Button>
      {result && (
        <div className="text-xs mt-2 p-2 bg-black/20 rounded">
          {result}
        </div>
      )}
    </div>
  );
}