import type { ConfirmedSignatureInfo } from '@solana/web3.js';

import {
    AUCTION_SIGNATURE_LIMIT,
    formatFailedSampled,
    formatSampledCount,
    formatWindowCount,
    shortenAuctionActivityError,
    summarizeAuctionActivity,
} from '../auction-activity';

function sig(blockTime?: number | null, failed = false): ConfirmedSignatureInfo {
    return {
        blockTime,
        confirmationStatus: 'finalized',
        err: failed ? ({ InstructionError: [0, 'Custom'] } as any) : null,
        memo: null,
        signature: String(blockTime ?? Math.random()),
        slot: 1,
    };
}

describe('auction activity summary', () => {
    it('should mark capped samples within one hour as at least counts', () => {
        const now = 1_000_000;
        const signatures = Array.from({ length: AUCTION_SIGNATURE_LIMIT }, (_, index) => sig(now - index));
        const summary = summarizeAuctionActivity(signatures, now);

        expect(formatSampledCount(summary)).toBe('1,000+');
        expect(summary.sampleWindowLabel).toBe('covers ~17m');
        expect(formatWindowCount(summary.txs1h)).toBe('at least 1,000');
        expect(formatWindowCount(summary.txs24h)).toBe('at least 1,000');
    });

    it('should report exact windows when the sample reaches older than 24h', () => {
        const now = 1_000_000;
        const summary = summarizeAuctionActivity([sig(now - 100), sig(now - 3_700), sig(now - 90_000)], now);

        expect(formatSampledCount(summary)).toBe('3');
        expect(summary.sampleWindowLabel).toBe('covers 24h+');
        expect(formatWindowCount(summary.txs1h)).toBe('1');
        expect(formatWindowCount(summary.txs24h)).toBe('2');
    });

    it('should ignore signatures without block times for time-window math', () => {
        const now = 1_000_000;
        const summary = summarizeAuctionActivity([sig(null, true), sig(undefined, true), sig(now - 30, true)], now);

        expect(summary.sampled).toBe(3);
        expect(summary.timedSampled).toBe(1);
        expect(formatWindowCount(summary.txs1h)).toBe('1');
        expect(formatFailedSampled(summary)).toBe('1 (100.0%)');
    });

    it('should compute failed sampled transaction percentage from timestamped signatures', () => {
        const now = 1_000_000;
        const summary = summarizeAuctionActivity([sig(now - 1, true), sig(now - 2), sig(now - 3), sig(now - 4)], now);

        expect(formatFailedSampled(summary)).toBe('1 (25.0%)');
    });

    it('should shorten long RPC errors', () => {
        const message = `rpc ${'x'.repeat(160)}`;

        expect(shortenAuctionActivityError(message)).toHaveLength(120);
        expect(shortenAuctionActivityError(message).endsWith('…')).toBe(true);
    });
});
