import { PublicKey } from '@solana/web3.js';
import { AUCTION_PROGRAM_ID } from '@validators/accounts/auction';
import bs58 from 'bs58';

const BUNDLE_VERIFIER_PAGE_V2_SEED = new TextEncoder().encode('bundle_verifier_page_v2');

export function bundleVerifierJobIdToUuid(value: string): string | undefined {
    try {
        const bytes = bs58.decode(value);
        if (bytes.length !== 32 || bytes.subarray(16).some(byte => byte !== 0)) return;

        const hex = Array.from(bytes.subarray(0, 16), byte => byte.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    } catch {
        return;
    }
}

export function findBundleVerifierPageV2(bundleEscrow: PublicKey, pageIndex: number): PublicKey {
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex > 0xffff) throw new RangeError('Invalid page index');
    const pageIndexLe = new Uint8Array([pageIndex & 0xff, pageIndex >> 8]);
    return PublicKey.findProgramAddressSync(
        [BUNDLE_VERIFIER_PAGE_V2_SEED, bundleEscrow.toBytes(), pageIndexLe],
        new PublicKey(AUCTION_PROGRAM_ID),
    )[0];
}
