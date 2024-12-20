'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

export function VersionInfo() {
    const [copied, setCopied] = useState(false);
    const appVersion = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev';
    const { user } = usePrivy();

    const handleCopy = async () => {    
        const fullInfo = {
            version: appVersion,
            browser: navigator.userAgent,
            path: window.location.pathname,
            userId: user?.id || 'anonymous'
        };

        await navigator.clipboard.writeText(JSON.stringify(fullInfo, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>v{appVersion}</span>
            <button
                onClick={handleCopy}
                className="hover:text-gray-700 transition-colors"
                title="Copy system info"
            >
                {copied ? (
                    <Check size={14} />
                ) : (
                    <Copy size={14} />
                )}
            </button>
        </div>
    );
} 