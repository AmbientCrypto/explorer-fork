import { bundleVerifierJobIdToUuid } from '@utils/auction-v2';
import React from 'react';

export function AuctionJobId({ value }: { value: string }) {
    const uuid = bundleVerifierJobIdToUuid(value);
    if (!uuid) return <span className="font-monospace text-break">{value}</span>;

    return (
        <span className="d-inline-flex flex-column font-monospace text-break">
            <span>{uuid}</span>
            <span className="text-muted">chatcmpl-{uuid}</span>
        </span>
    );
}
