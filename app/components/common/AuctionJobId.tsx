import { bundleVerifierJobIdToUuid } from '@utils/auction-v2';
import React from 'react';

export function AuctionJobId({ value }: { value: string }) {
    const uuid = bundleVerifierJobIdToUuid(value);
    if (!uuid) return <span className="break-all font-mono">{value}</span>;

    return (
        <span className="grid gap-1 text-left">
            <span className="flex items-start gap-2">
                <span className="w-14 shrink-0 text-dk-xs uppercase tracking-[0.08em] text-dark-muted-foreground">
                    UUID
                </span>
                <span className="min-w-0 break-all font-mono">{uuid}</span>
            </span>
            <span className="flex items-start gap-2">
                <span className="w-14 shrink-0 text-dk-xs uppercase tracking-[0.08em] text-dark-muted-foreground">
                    Chat ID
                </span>
                <span className="min-w-0 break-all font-mono text-dark-muted-foreground">chatcmpl-{uuid}</span>
            </span>
        </span>
    );
}
