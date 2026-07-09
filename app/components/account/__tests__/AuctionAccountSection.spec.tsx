import { AuctionAccountSection } from '@components/account/AuctionAccountSection';
import { showGenericAccountTabs } from '@components/account/tabs';
import { handleParsedAccountData } from '@providers/accounts';
import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { AUCTION_PROGRAM_ID } from '@validators/accounts/auction';
import { useSearchParams } from 'next/navigation';
import { expect, test, vi } from 'vitest';

vi.mock('next/navigation');
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({
        cluster: 0,
        status: 0,
        url: 'http://localhost:8899',
    }),
}));
vi.mock('@providers/accounts', async importOriginal => {
    const actual = await importOriginal<typeof import('@providers/accounts')>();
    return {
        ...actual,
        useFetchAccountInfo: () => vi.fn(),
    };
});

// @ts-expect-error does not contain `mockReturnValue`
useSearchParams.mockReturnValue({
    get: () => 'mainnet-beta',
    has: () => false,
    toString: () => '',
});

const accountAddress = new PublicKey('8WfKuumhRtY6QBPq416oGx5H5DwYA73T6VN54qdcKYfU');
const auctionProgramId = new PublicKey(AUCTION_PROGRAM_ID);
const pubkey = '11111111111111111111111111111112';
const secondPubkey = '11111111111111111111111111111113';

function makeAccount(parsed: any) {
    return {
        data: {
            parsed: {
                parsed,
                program: 'auction',
            },
        },
        executable: false,
        lamports: 1_000,
        owner: auctionProgramId,
        pubkey: accountAddress,
        space: 1_024,
    };
}

const bundleEscrow = {
    info: {
        acceptedOutputTokens: 8,
        auctionHash: 'auction-hash-base64',
        auctionHashBase58: 'auction-hash-base58',
        bundleHash: 'bundle-hash-base64',
        bundleHashBase58: 'bundle-hash-base58',
        bundleVersion: 7,
        claimDeadlineSlot: 104,
        clearingPricePerOutputToken: 100,
        coordinator: pubkey,
        escrowLamports: 10_000,
        layoutVersion: 'v2',
        maxOutputTokens: 10,
        postedOutputTokens: 9,
        quorumVerifierBitmap: 2,
        quorumVerifierIndexes: [1],
        requesterRefundRecipient: secondPubkey,
        resultDeadlineSlot: 102,
        resultHash: 'result-hash-base64',
        resultHashBase58: 'result-hash-base58',
        rewardTier: { name: 'small', value: 1 },
        selectedVerifierIndexes: [1],
        selectedVerifiers: ['11111111111111111111111111111111', pubkey],
        settlementDeadlineSlot: 101,
        status: { name: 'resultPosted', terminal: false, value: 2 },
        totalInputTokens: 5,
        verificationDeadlineSlot: 103,
        verificationHash: 'verification-hash-base64',
        verificationHashBase58: 'verification-hash-base58',
        verifierPageCount: 1,
        verifierRewardClaimedBitmap: 1,
        verifierRewardClaimedIndexes: [0],
        verifierRewardRemaining: [1, 2],
        winnerNodePubkey: pubkey,
        winnerPayoutLamports: 900,
        winnerRewardClaimed: false,
        winnerVoteAccount: secondPubkey,
    },
    type: 'bundleEscrowV2',
};

test('should dispatch auction parsed accounts from jsonParsed data', async () => {
    const parsed = await handleParsedAccountData(
        new Connection('http://localhost:8899'),
        accountAddress,
        {
            parsed: bundleEscrow,
            program: 'auction',
            space: 1_024,
        } as ParsedAccountData,
        'http://localhost:8899',
        1_000,
    );

    expect(parsed?.program).toBe('auction');
    expect(parsed?.parsed.type).toBe('bundleEscrowV2');
});

test('should hide generic tokens and domains tabs for auction accounts', () => {
    expect(showGenericAccountTabs({ parsed: bundleEscrow, program: 'auction' } as any, 'auction:bundleEscrowV2')).toBe(
        false,
    );
});

test('should render bundle escrow v2 details', () => {
    render(<AuctionAccountSection account={makeAccount(bundleEscrow) as any} auctionAccount={bundleEscrow as any} />);

    expect(screen.getByText('Auction Bundle Escrow V2')).toBeInTheDocument();
    expect(screen.getByText('Result Posted')).toBeInTheDocument();
    expect(screen.getByText('bundle-hash-base58')).toBeInTheDocument();
    expect(screen.getByText('Verifier Page Count')).toBeInTheDocument();
});

test('should render verifier page v2 entries', () => {
    const verifierPage = {
        info: {
            bundleEscrow: pubkey,
            entries: [
                {
                    acceptedOutputTokens: 4,
                    assignedVerifiersTokenRanges: [0, 4],
                    jobId: secondPubkey,
                    postedOutputTokens: 5,
                    verdict: { name: 'verified', value: 1 },
                    verifierClaimedBitmap: 2,
                    verifierClaimedIndexes: [1],
                    verifierRewardTokens: [10],
                },
            ],
            entryCount: 1,
            layoutVersion: 'v2',
            pageIndex: 0,
        },
        type: 'bundleVerifierPageV2',
    };

    render(<AuctionAccountSection account={makeAccount(verifierPage) as any} auctionAccount={verifierPage as any} />);

    expect(screen.getByText('Auction Verifier Page V2')).toBeInTheDocument();
    expect(screen.getByText('Verifier Entries')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
});

test('should render config policy v2 details', () => {
    const configPolicy = {
        info: {
            adminAuthorities: ['11111111111111111111111111111111', pubkey],
            adminAuthorityIndexes: [1],
            bump: 9,
            maxAuctionCreditsPerUpdate: 12,
            minimumBundleAuctionPairs: 2,
            policyFlags: { bits: 2, names: ['allowServiceCommitOverride'] },
            serviceAuthorities: [secondPubkey],
            serviceAuthorityIndexes: [0],
            tierConfigs: {
                small: {
                    activeAuctionDuration: 1,
                    auctionCreditsMultiplier: 2,
                    bidCommitmentAmountMultiplier: 3,
                    bidRevealDuration: 4,
                    bundleDuration: 5,
                    claimWindowSlots: 6,
                    jobSubmissionDurationSlots: 7,
                    maxContextLengthTokens: 8,
                    requestsPerBundle: 9,
                    resultWindowSlots: 10,
                    settlementWindowSlots: 11,
                    verificationWindowSlots: 12,
                },
            },
            v2AccountLayoutVersion: 'v2',
            v2VerifierQuorum: 5,
            v2VerifiersPerAuction: 8,
        },
        type: 'configPolicyV2',
    };

    render(<AuctionAccountSection account={makeAccount(configPolicy) as any} auctionAccount={configPolicy as any} />);

    expect(screen.getByText('Auction Config Policy V2')).toBeInTheDocument();
    expect(screen.getByText('Allow Service Commit Override')).toBeInTheDocument();
    expect(screen.getByText('Tier Configs')).toBeInTheDocument();
});
