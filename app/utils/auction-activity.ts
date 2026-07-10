import type { ConfirmedSignatureInfo } from '@solana/web3.js';

export const AUCTION_SIGNATURE_LIMIT = 1000;

const HOUR_SECONDS = 60 * 60;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const ERROR_PREVIEW_LENGTH = 120;

export type AuctionActivitySummary = {
    failedSampled: number;
    latestBlockTime?: number;
    oldestBlockTime?: number;
    sampleCapped: boolean;
    sampleWindowLabel: string;
    sampled: number;
    timedSampled: number;
    txs1h: WindowCount;
    txs24h: WindowCount;
};

export type WindowCount = {
    complete: boolean;
    count: number;
};

export function summarizeAuctionActivity(
    signatures: ConfirmedSignatureInfo[],
    now: number,
    limit = AUCTION_SIGNATURE_LIMIT,
): AuctionActivitySummary {
    const hourAgo = now - HOUR_SECONDS;
    const dayAgo = now - DAY_SECONDS;
    const sampleCapped = signatures.length >= limit;
    let txs1h = 0;
    let txs24h = 0;
    let failedSampled = 0;
    let timedSampled = 0;
    let latestBlockTime: number | undefined;
    let oldestBlockTime: number | undefined;

    for (const signature of signatures) {
        if (signature.blockTime == undefined) {
            continue;
        }

        timedSampled++;
        latestBlockTime = Math.max(latestBlockTime ?? 0, signature.blockTime);
        oldestBlockTime = Math.min(oldestBlockTime ?? signature.blockTime, signature.blockTime);
        if (signature.err) {
            failedSampled++;
        }
        if (signature.blockTime >= hourAgo) {
            txs1h++;
        }
        if (signature.blockTime >= dayAgo) {
            txs24h++;
        }
    }

    return {
        failedSampled,
        latestBlockTime,
        oldestBlockTime,
        sampleCapped,
        sampleWindowLabel: formatSampleWindow(oldestBlockTime, latestBlockTime),
        sampled: signatures.length,
        timedSampled,
        txs1h: { complete: isWindowComplete(sampleCapped, oldestBlockTime, hourAgo), count: txs1h },
        txs24h: { complete: isWindowComplete(sampleCapped, oldestBlockTime, dayAgo), count: txs24h },
    };
}

export function formatSampledCount(summary: AuctionActivitySummary) {
    return `${summary.sampled.toLocaleString('en-US')}${summary.sampleCapped ? '+' : ''}`;
}

export function formatWindowCount(window: WindowCount) {
    const count = window.count.toLocaleString('en-US');
    return window.complete ? count : `at least ${count}`;
}

export function formatFailedSampled(summary: AuctionActivitySummary) {
    const failed = summary.failedSampled.toLocaleString('en-US');
    if (summary.timedSampled === 0) {
        return `${failed} (n/a)`;
    }

    const rate = (summary.failedSampled / summary.timedSampled) * 100;
    return `${failed} (${rate.toFixed(1)}%)`;
}

export function shortenAuctionActivityError(message: string) {
    return message.length <= ERROR_PREVIEW_LENGTH ? message : `${message.slice(0, ERROR_PREVIEW_LENGTH - 1)}…`;
}

function isWindowComplete(sampleCapped: boolean, oldestBlockTime: number | undefined, cutoff: number) {
    return !sampleCapped || oldestBlockTime === undefined || oldestBlockTime <= cutoff;
}

function formatSampleWindow(oldestBlockTime: number | undefined, latestBlockTime: number | undefined) {
    if (oldestBlockTime === undefined || latestBlockTime === undefined) {
        return 'no timestamped txs';
    }

    const seconds = Math.max(0, latestBlockTime - oldestBlockTime);
    if (seconds >= DAY_SECONDS) {
        return 'covers 24h+';
    }
    if (seconds >= HOUR_SECONDS) {
        return `covers ~${Math.round(seconds / HOUR_SECONDS)}h`;
    }
    if (seconds >= 60) {
        return `covers ~${Math.max(1, Math.round(seconds / 60))}m`;
    }
    return 'covers <1m';
}
