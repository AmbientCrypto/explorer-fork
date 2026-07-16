import { AuctionAccountSection } from '@components/account/AuctionAccountSection';
import { showGenericAccountTabs } from '@components/account/tabs';
import { handleParsedAccountData } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { Connection, ParsedAccountData, PublicKey, SystemProgram } from '@solana/web3.js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { findBundleVerifierPageV2 } from '@utils/auction-v2';
import { AUCTION_PROGRAM_ID } from '@validators/accounts/auction';
import { useSearchParams } from 'next/navigation';
import { beforeEach, expect, test, vi } from 'vitest';

const accountProviderMocks = vi.hoisted(() => ({
    entries: [] as any[],
    fetch: vi.fn(),
}));

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
        useAccountInfos: (addresses: string[]) => addresses.map((_, index) => accountProviderMocks.entries[index]),
        useFetchAccountInfo: () => accountProviderMocks.fetch,
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
const zeroHashBase58 = '11111111111111111111111111111111';
const zeroHashBase64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
const uuid = '0190a1b2-c3d4-7e5f-8123-456789abcdef';
const jobId = '77KbfHQ1a7bSPVXHJd7AxVq8bTWTcJQb5wp4LA4roX5';

beforeEach(() => {
    accountProviderMocks.entries = [];
    accountProviderMocks.fetch.mockClear();
});

function makeAccount(parsed: any, address = accountAddress) {
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
        pubkey: address,
        space: 1_024,
    };
}

function makeMissingAccount(address: PublicKey) {
    return {
        data: { raw: new Uint8Array() },
        executable: false,
        lamports: 0,
        owner: SystemProgram.programId,
        pubkey: address,
        space: 0,
    };
}

function makeVerifierPage(bundleEscrow: string) {
    return {
        info: {
            bundleEscrow,
            entries: [
                {
                    acceptedOutputTokens: 4,
                    assignedVerifiersTokenRanges: [0, 4],
                    jobId,
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

function renderBundleEscrow(overrides: Record<string, unknown>) {
    const account = {
        ...bundleEscrow,
        info: {
            ...bundleEscrow.info,
            ...overrides,
        },
    };
    render(<AuctionAccountSection account={makeAccount(account) as any} auctionAccount={account as any} />);
}

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
    expect(screen.getByLabelText('Bitmap 00000001, decimal 1; set verifier indexes 0')).toBeInTheDocument();
    expect(screen.getByLabelText('Bitmap 00000010, decimal 2; set verifier indexes 1')).toBeInTheDocument();
});

test('should render unset auction hash as pending settlement', () => {
    renderBundleEscrow({
        auctionHash: zeroHashBase64,
        auctionHashBase58: zeroHashBase58,
        resultHash: zeroHashBase64,
        resultHashBase58: zeroHashBase58,
        status: { name: 'open', terminal: false, value: 0 },
        verificationHash: zeroHashBase64,
        verificationHashBase58: zeroHashBase58,
    });

    expect(screen.getByText('Settlement not committed yet')).toBeInTheDocument();
    expect(screen.queryByText(`Base64: ${zeroHashBase64}`)).not.toBeInTheDocument();
});

test('should render unset result hash as pending result post', () => {
    renderBundleEscrow({
        resultHash: zeroHashBase64,
        resultHashBase58: zeroHashBase58,
        status: { name: 'awarded', terminal: false, value: 1 },
        verificationHash: zeroHashBase64,
        verificationHashBase58: zeroHashBase58,
    });

    expect(screen.getByText('Result not posted yet')).toBeInTheDocument();
});

test('should render unset verification hash as pending finalization', () => {
    renderBundleEscrow({
        status: { name: 'resultPosted', terminal: false, value: 2 },
        verificationHash: zeroHashBase64,
        verificationHashBase58: zeroHashBase58,
    });

    expect(screen.getByText('Verification not finalized yet')).toBeInTheDocument();
});

test('should render non-zero finalized hashes with base64 detail', () => {
    renderBundleEscrow({
        status: { name: 'finalizedVerified', terminal: true, value: 3 },
    });

    expect(screen.getByText('result-hash-base58')).toBeInTheDocument();
    expect(screen.getByText('Base64: result-hash-base64')).toBeInTheDocument();
    expect(screen.getByText('verification-hash-base58')).toBeInTheDocument();
    expect(screen.getByText('Base64: verification-hash-base64')).toBeInTheDocument();
});

test('should render unexpected lifecycle zero hash as suspicious', () => {
    renderBundleEscrow({
        resultHash: zeroHashBase64,
        resultHashBase58: zeroHashBase58,
        status: { name: 'resultPosted', terminal: false, value: 2 },
    });

    expect(screen.getByText('Zero hash')).toBeInTheDocument();
});

test('should render verifier page v2 entries', () => {
    const verifierPage = makeVerifierPage(pubkey);

    render(<AuctionAccountSection account={makeAccount(verifierPage) as any} auctionAccount={verifierPage as any} />);

    expect(screen.getByText('Auction Verifier Page V2')).toBeInTheDocument();
    expect(screen.getByText('Verifier Entries')).toBeInTheDocument();
    expect(screen.getByText('Job IDs')).toBeInTheDocument();
    expect(screen.getByText('Verifier Allocation')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByLabelText('Bitmap 00000010, decimal 2; set verifier indexes 1')).toBeInTheDocument();
});

test('should render finalized verifier pages inline on the bundle escrow', () => {
    const pageAddress = findBundleVerifierPageV2(accountAddress, 0);
    const verifierPage = makeVerifierPage(accountAddress.toBase58());
    accountProviderMocks.entries = [{ data: makeAccount(verifierPage, pageAddress), status: FetchStatus.Fetched }];

    renderBundleEscrow({
        status: { name: 'finalizedVerified', terminal: true, value: 3 },
        verifierPageCount: 1,
    });

    expect(screen.getByText('Auction Verifier Page V2')).toBeInTheDocument();
    expect(screen.getByText(pageAddress.toBase58())).toBeInTheDocument();
    expect(screen.getByText(uuid)).toBeInTheDocument();
    expect(screen.getByText(`chatcmpl-${uuid}`)).toBeInTheDocument();
});

test('should probe three pages and ignore missing accounts while results are posted', async () => {
    const pageAddresses = [0, 1, 2].map(index => findBundleVerifierPageV2(accountAddress, index));
    accountProviderMocks.entries = pageAddresses.map(address => ({
        data: makeMissingAccount(address),
        status: FetchStatus.Fetched,
    }));

    renderBundleEscrow({
        status: { name: 'resultPosted', terminal: false, value: 2 },
        verifierPageCount: 0,
    });

    expect(screen.getByText('Verifier pages have not been posted yet.')).toBeInTheDocument();
    await waitFor(() => expect(accountProviderMocks.fetch).toHaveBeenCalledTimes(3));
    expect(accountProviderMocks.fetch.mock.calls.map(([address]) => address.toBase58())).toEqual(
        pageAddresses.map(address => address.toBase58()),
    );
});

test('should render posted verifier pages after the bundle expires', async () => {
    const pageAddresses = [0, 1, 2].map(index => findBundleVerifierPageV2(accountAddress, index));
    const verifierPage = makeVerifierPage(accountAddress.toBase58());
    accountProviderMocks.entries = [
        { data: makeAccount(verifierPage, pageAddresses[0]), status: FetchStatus.Fetched },
        ...pageAddresses.slice(1).map(address => ({
            data: makeMissingAccount(address),
            status: FetchStatus.Fetched,
        })),
    ];

    renderBundleEscrow({
        status: { name: 'expired', terminal: true, value: 5 },
        verifierPageCount: 0,
    });

    expect(screen.getByText('Auction Verifier Page V2')).toBeInTheDocument();
    expect(screen.getByText(uuid)).toBeInTheDocument();
    await waitFor(() => expect(accountProviderMocks.fetch).toHaveBeenCalledTimes(3));
});

test('should not render verifier pages when the bundle expires before results are posted', async () => {
    const pageAddresses = [0, 1, 2].map(index => findBundleVerifierPageV2(accountAddress, index));
    accountProviderMocks.entries = pageAddresses.map(address => ({
        data: makeMissingAccount(address),
        status: FetchStatus.Fetched,
    }));

    renderBundleEscrow({
        resultHash: zeroHashBase64,
        resultHashBase58: zeroHashBase58,
        status: { name: 'expired', terminal: true, value: 5 },
        verifierPageCount: 0,
    });

    expect(screen.queryByText('Auction Verifier Page V2')).not.toBeInTheDocument();
    expect(screen.getByText('Verifier pages have not been posted yet.')).toBeInTheDocument();
    await waitFor(() => expect(accountProviderMocks.fetch).toHaveBeenCalledTimes(3));
});

test('should retry the escrow and finalized verifier pages after an RPC error', async () => {
    const pageAddress = findBundleVerifierPageV2(accountAddress, 0);
    accountProviderMocks.entries = [{ status: FetchStatus.FetchFailed }];

    renderBundleEscrow({
        status: { name: 'finalizedVerified', terminal: true, value: 3 },
        verifierPageCount: 1,
    });

    expect(screen.getByText('Failed to load verifier pages')).toBeInTheDocument();
    await waitFor(() => expect(accountProviderMocks.fetch).toHaveBeenCalledTimes(1));
    accountProviderMocks.fetch.mockClear();
    fireEvent.click(screen.getAllByText('Try Again')[0]);

    expect(accountProviderMocks.fetch).toHaveBeenCalledTimes(2);
    expect(accountProviderMocks.fetch.mock.calls.map(([address]) => address.toBase58())).toEqual([
        accountAddress.toBase58(),
        pageAddress.toBase58(),
    ]);
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
