import { PublicKey } from '@solana/web3.js';
import { bundleVerifierJobIdToUuid, findBundleVerifierPageV2 } from '@utils/auction-v2';
import bs58 from 'bs58';
import { describe, expect, test } from 'vitest';

const uuid = '0190a1b2-c3d4-7e5f-8123-456789abcdef';
const jobId = '77KbfHQ1a7bSPVXHJd7AxVq8bTWTcJQb5wp4LA4roX5';

describe('Auction V2 verifier job IDs', () => {
    test('should decode a padded on-chain job ID', () => {
        expect(bundleVerifierJobIdToUuid(jobId)).toBe(uuid);
    });

    test('should reject malformed padded job IDs', () => {
        const nonZeroPadding = new Uint8Array(32);
        nonZeroPadding[16] = 1;

        expect(bundleVerifierJobIdToUuid('not-base58')).toBeUndefined();
        expect(bundleVerifierJobIdToUuid(bs58.encode(new Uint8Array(16)))).toBeUndefined();
        expect(bundleVerifierJobIdToUuid(bs58.encode(nonZeroPadding))).toBeUndefined();
    });
});

describe('Auction V2 verifier pages', () => {
    test('should derive the same PDA as the Rust client seed order', () => {
        const address = findBundleVerifierPageV2(new PublicKey('11111111111111111111111111111111'), 3);

        expect(address.toBase58()).toBe('G3dkmGJx3W9A7occR2KZs82XVkZydnyBd8C9qS5JmnRA');
    });
});
