/* eslint-disable @typescript-eslint/no-redeclare */

import { any, enums, Infer, type } from 'superstruct';

export const AUCTION_PROGRAM_ID = 'Auction111111111111111111111111111111111111';

export type AuctionAccountType = Infer<typeof AuctionAccountType>;
export const AuctionAccountType = enums(['bundleEscrowV2', 'bundleVerifierPageV2', 'configPolicyV2']);

export type AuctionEnum = {
    name: string;
    value: number;
    terminal?: boolean;
};

export type AuctionTierConfig = {
    bidRevealDuration: number;
    activeAuctionDuration: number;
    bundleDuration: number;
    requestsPerBundle: number;
    maxContextLengthTokens: number;
    jobSubmissionDurationSlots: number;
    bidCommitmentAmountMultiplier: number;
    auctionCreditsMultiplier: number;
    settlementWindowSlots: number;
    resultWindowSlots: number;
    verificationWindowSlots: number;
    claimWindowSlots: number;
};

export type BundleEscrowV2Info = {
    layoutVersion: string;
    status: AuctionEnum;
    rewardTier: AuctionEnum;
    coordinator: string;
    requesterRefundRecipient: string;
    bundleVersion: number;
    bundleHash: string;
    bundleHashBase58?: string;
    totalInputTokens: number;
    maxOutputTokens: number;
    escrowLamports: number;
    winnerNodePubkey: string;
    winnerVoteAccount: string;
    clearingPricePerOutputToken: number;
    selectedVerifiers: string[];
    selectedVerifierIndexes?: number[];
    auctionHash: string;
    auctionHashBase58?: string;
    resultHash: string;
    resultHashBase58?: string;
    verificationHash: string;
    verificationHashBase58?: string;
    postedOutputTokens: number;
    acceptedOutputTokens: number;
    winnerPayoutLamports: number;
    settlementDeadlineSlot: number;
    resultDeadlineSlot: number;
    verificationDeadlineSlot: number;
    claimDeadlineSlot: number;
    winnerRewardClaimed: boolean;
    verifierRewardClaimedBitmap: number;
    verifierRewardClaimedIndexes?: number[];
    quorumVerifierBitmap: number;
    quorumVerifierIndexes?: number[];
    verifierPageCount: number;
    verifierRewardRemaining: number[];
};

export type BundleVerifierPageV2Entry = {
    jobId: string;
    postedOutputTokens: number;
    acceptedOutputTokens: number;
    assignedVerifiersTokenRanges: number[];
    verifierRewardTokens: number[];
    verdict: AuctionEnum;
    verifierClaimedBitmap: number;
    verifierClaimedIndexes?: number[];
};

export type BundleVerifierPageV2Info = {
    layoutVersion: string;
    bundleEscrow: string;
    pageIndex: number;
    entryCount: number;
    entries: BundleVerifierPageV2Entry[];
};

export type ConfigPolicyV2Info = {
    bump: number;
    minimumBundleAuctionPairs: number;
    policyFlags: {
        bits: number;
        names: string[];
    };
    maxAuctionCreditsPerUpdate: number;
    adminAuthorities: string[];
    adminAuthorityIndexes?: number[];
    serviceAuthorities: string[];
    serviceAuthorityIndexes?: number[];
    v2VerifiersPerAuction: number;
    v2VerifierQuorum: number;
    tierConfigs: Record<string, AuctionTierConfig>;
    v2AccountLayoutVersion: string | { raw: number; invalid: true };
};

export type AuctionAccount = Infer<typeof AuctionAccount>;
export const AuctionAccount = type({
    info: any(),
    type: AuctionAccountType,
});
