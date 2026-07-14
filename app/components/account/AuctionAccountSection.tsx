import { AccountAddressRow, AccountBalanceRow, AccountHeader } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { AuctionJobId } from '@components/common/AuctionJobId';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account, useAccountInfos, useFetchAccountInfo } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { findBundleVerifierPageV2 } from '@utils/auction-v2';
import { camelToTitleCase, snakeToTitleCase } from '@utils/index';
import {
    AuctionAccount,
    AuctionEnum,
    AuctionTierConfig,
    BundleEscrowV2Info,
    BundleVerifierPageV2Entry,
    BundleVerifierPageV2Info,
    ConfigPolicyV2Info,
} from '@validators/accounts/auction';
import React from 'react';

const DEFAULT_PUBKEY = '11111111111111111111111111111111';
const ZERO_HASH_BASE64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
const BUNDLE_STATUS = {
    awarded: 1,
    expired: 5,
    open: 0,
    resultPosted: 2,
};
const MAX_BUNDLE_VERIFIER_PAGES = 3;

export function AuctionAccountSection({
    account,
    auctionAccount,
}: {
    account: Account;
    auctionAccount: AuctionAccount;
}) {
    switch (auctionAccount.type) {
        case 'bundleEscrowV2':
            return <BundleEscrowCard account={account} info={auctionAccount.info as BundleEscrowV2Info} />;
        case 'bundleVerifierPageV2':
            return <BundleVerifierPageCard account={account} info={auctionAccount.info as BundleVerifierPageV2Info} />;
        case 'configPolicyV2':
            return <ConfigPolicyCard account={account} info={auctionAccount.info as ConfigPolicyV2Info} />;
    }
}

function BundleEscrowCard({ account, info }: { account: Account; info: BundleEscrowV2Info }) {
    const refresh = useFetchAccountInfo();
    const pageCount =
        info.status.value === BUNDLE_STATUS.resultPosted ? MAX_BUNDLE_VERIFIER_PAGES : info.verifierPageCount;
    const pageAddresses = React.useMemo(
        () => Array.from({ length: pageCount }, (_, index) => findBundleVerifierPageV2(account.pubkey, index)),
        [account.pubkey, pageCount],
    );
    const pageEntries = useAccountInfos(pageAddresses.map(address => address.toBase58()));
    const refreshAll = React.useCallback(() => {
        refresh(account.pubkey, 'parsed');
        pageAddresses.forEach(address => refresh(address, 'parsed'));
    }, [account.pubkey, pageAddresses, refresh]);

    React.useEffect(() => {
        pageAddresses.forEach(address => refresh(address, 'parsed'));
    }, [pageAddresses, refresh]);

    const verifierPages: { account: Account; info: BundleVerifierPageV2Info }[] = [];
    for (const entry of pageEntries) {
        if (entry?.status !== FetchStatus.Fetched || !entry.data) continue;
        const parsed = entry.data.data.parsed;
        if (parsed?.program !== 'auction' || parsed.parsed.type !== 'bundleVerifierPageV2') continue;
        verifierPages.push({ account: entry.data, info: parsed.parsed.info as BundleVerifierPageV2Info });
    }
    const pageFetchFailed = pageEntries.some(entry => entry?.status === FetchStatus.FetchFailed);
    const pageFetchPending = pageEntries.some(entry => !entry || entry.status === FetchStatus.Fetching);
    let verifierPagesContent: React.ReactNode;
    if (pageAddresses.length === 0) {
        verifierPagesContent = undefined;
    } else if (pageFetchFailed) {
        verifierPagesContent = <ErrorCard text="Failed to load verifier pages" retry={refreshAll} />;
    } else if (pageFetchPending) {
        verifierPagesContent = <LoadingCard message="Loading verifier pages" />;
    } else if (verifierPages.length > 0) {
        verifierPagesContent = verifierPages.map(page => (
            <BundleVerifierPageCard
                key={page.account.pubkey.toBase58()}
                account={page.account}
                info={page.info}
                onRefresh={refreshAll}
            />
        ));
    } else {
        verifierPagesContent = (
            <div className="card">
                <div className="card-body text-center text-muted">Verifier pages have not been posted yet.</div>
            </div>
        );
    }

    return (
        <>
            <div className="card">
                <AccountHeader
                    title="Auction Bundle Escrow V2"
                    analyticsSection="auction_bundle_escrow_section"
                    refresh={refreshAll}
                />

                <TableCardBody>
                    <AccountAddressRow account={account} />
                    <AccountBalanceRow account={account} />
                    <TextRow label="Layout Version" value={info.layoutVersion} />
                    <EnumRow label="Status" value={info.status} />
                    <EnumRow label="Reward Tier" value={info.rewardTier} />
                    <AddressRow label="Coordinator" value={info.coordinator} />
                    <AddressRow label="Requester Refund Recipient" value={info.requesterRefundRecipient} />
                    <TextRow label="Bundle Version" value={info.bundleVersion} />
                    <HashRow label="Bundle Hash" base58={info.bundleHashBase58} base64={info.bundleHash} />
                    <TextRow label="Total Input Tokens" value={info.totalInputTokens} />
                    <TextRow label="Max Output Tokens" value={info.maxOutputTokens} />
                    <TextRow label="Escrow Lamports" value={info.escrowLamports} />
                    <AddressRow label="Winner Node Pubkey" value={info.winnerNodePubkey} />
                    <AddressRow label="Winner Vote Account" value={info.winnerVoteAccount} />
                    <TextRow label="Clearing Price Per Output Token" value={info.clearingPricePerOutputToken} />
                    <tr>
                        <td>Selected Verifiers</td>
                        <td className="text-lg-end">
                            <PubkeyList values={info.selectedVerifiers} indexes={info.selectedVerifierIndexes} />
                        </td>
                    </tr>
                    <HashRow
                        label="Auction Hash"
                        base58={info.auctionHashBase58}
                        base64={info.auctionHash}
                        placeholder={lifecycleHashPlaceholder(info, 'auction')}
                    />
                    <HashRow
                        label="Result Hash"
                        base58={info.resultHashBase58}
                        base64={info.resultHash}
                        placeholder={lifecycleHashPlaceholder(info, 'result')}
                    />
                    <HashRow
                        label="Verification Hash"
                        base58={info.verificationHashBase58}
                        base64={info.verificationHash}
                        placeholder={lifecycleHashPlaceholder(info, 'verification')}
                    />
                    <TextRow label="Posted Output Tokens" value={info.postedOutputTokens} />
                    <TextRow label="Accepted Output Tokens" value={info.acceptedOutputTokens} />
                    <TextRow label="Winner Payout Lamports" value={info.winnerPayoutLamports} />
                    <SlotRow label="Settlement Deadline Slot" value={info.settlementDeadlineSlot} />
                    <SlotRow label="Result Deadline Slot" value={info.resultDeadlineSlot} />
                    <SlotRow label="Verification Deadline Slot" value={info.verificationDeadlineSlot} />
                    <SlotRow label="Claim Deadline Slot" value={info.claimDeadlineSlot} />
                    <TextRow label="Winner Reward Claimed" value={info.winnerRewardClaimed ? 'Yes' : 'No'} />
                    <TextRow label="Verifier Reward Claimed Bitmap" value={info.verifierRewardClaimedBitmap} />
                    <IndexesRow label="Verifier Reward Claimed Indexes" indexes={info.verifierRewardClaimedIndexes} />
                    <TextRow label="Quorum Verifier Bitmap" value={info.quorumVerifierBitmap} />
                    <IndexesRow label="Quorum Verifier Indexes" indexes={info.quorumVerifierIndexes} />
                    <TextRow label="Verifier Page Count" value={info.verifierPageCount} />
                    <ArrayRow label="Verifier Reward Remaining" values={info.verifierRewardRemaining} />
                </TableCardBody>
            </div>
            {verifierPagesContent}
        </>
    );
}

function BundleVerifierPageCard({
    account,
    info,
    onRefresh,
}: {
    account: Account;
    info: BundleVerifierPageV2Info;
    onRefresh?: () => void;
}) {
    const refresh = useFetchAccountInfo();
    return (
        <>
            <div className="card">
                <AccountHeader
                    title="Auction Verifier Page V2"
                    analyticsSection="auction_verifier_page_section"
                    refresh={onRefresh ?? (() => refresh(account.pubkey, 'parsed'))}
                />

                <TableCardBody>
                    <AccountAddressRow account={account} />
                    <AccountBalanceRow account={account} />
                    <TextRow label="Layout Version" value={info.layoutVersion} />
                    <AddressRow label="Bundle Escrow" value={info.bundleEscrow} />
                    <TextRow label="Page Index" value={info.pageIndex} />
                    <TextRow label="Entry Count" value={info.entryCount} />
                </TableCardBody>
            </div>
            <VerifierEntriesCard entries={info.entries} />
        </>
    );
}

function ConfigPolicyCard({ account, info }: { account: Account; info: ConfigPolicyV2Info }) {
    const refresh = useFetchAccountInfo();
    return (
        <>
            <div className="card">
                <AccountHeader
                    title="Auction Config Policy V2"
                    analyticsSection="auction_config_policy_section"
                    refresh={() => refresh(account.pubkey, 'parsed')}
                />

                <TableCardBody>
                    <AccountAddressRow account={account} />
                    <AccountBalanceRow account={account} />
                    <TextRow label="Bump" value={info.bump} />
                    <TextRow label="Minimum Bundle Auction Pairs" value={info.minimumBundleAuctionPairs} />
                    <TextRow label="Policy Flag Bits" value={info.policyFlags?.bits} />
                    <ArrayRow label="Policy Flags" values={info.policyFlags?.names} />
                    <TextRow label="Max Auction Credits Per Update" value={info.maxAuctionCreditsPerUpdate} />
                    <TextRow label="V2 Verifiers Per Auction" value={info.v2VerifiersPerAuction} />
                    <TextRow label="V2 Verifier Quorum" value={info.v2VerifierQuorum} />
                    <TextRow label="V2 Account Layout Version" value={layoutVersionText(info.v2AccountLayoutVersion)} />
                    <tr>
                        <td>Admin Authorities</td>
                        <td className="text-lg-end">
                            <PubkeyList values={info.adminAuthorities} indexes={info.adminAuthorityIndexes} />
                        </td>
                    </tr>
                    <tr>
                        <td>Service Authorities</td>
                        <td className="text-lg-end">
                            <PubkeyList values={info.serviceAuthorities} indexes={info.serviceAuthorityIndexes} />
                        </td>
                    </tr>
                </TableCardBody>
            </div>
            <TierConfigCard configs={info.tierConfigs} />
        </>
    );
}

function VerifierEntriesCard({ entries }: { entries: BundleVerifierPageV2Entry[] }) {
    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-header-title">Verifier Entries</h3>
            </div>
            <div className="table-responsive mb-0">
                <table className="table-sm card-table table">
                    <thead>
                        <tr>
                            <th className="text-muted">Job</th>
                            <th className="text-muted">Posted</th>
                            <th className="text-muted">Accepted</th>
                            <th className="text-muted">Verdict</th>
                            <th className="text-muted">Claimed</th>
                            <th className="text-muted">Verifier Ranges / Rewards</th>
                        </tr>
                    </thead>
                    <tbody className="list">
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-muted">
                                    No entries
                                </td>
                            </tr>
                        ) : (
                            entries.map((entry, index) => (
                                <tr key={`${entry.jobId}-${index}`}>
                                    <td>
                                        <AuctionJobId value={entry.jobId} />
                                    </td>
                                    <td>{formatValue(entry.postedOutputTokens)}</td>
                                    <td>{formatValue(entry.acceptedOutputTokens)}</td>
                                    <td>
                                        <EnumBadge value={entry.verdict} />
                                    </td>
                                    <td>
                                        <IndexBadges indexes={entry.verifierClaimedIndexes} />
                                    </td>
                                    <td>
                                        <VerifierRanges
                                            ranges={entry.assignedVerifiersTokenRanges}
                                            rewards={entry.verifierRewardTokens}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TierConfigCard({ configs }: { configs: Record<string, AuctionTierConfig> | undefined }) {
    const entries = Object.entries(configs ?? {});
    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-header-title">Tier Configs</h3>
            </div>
            <div className="table-responsive mb-0">
                <table className="table-sm card-table table">
                    <thead>
                        <tr>
                            <th className="text-muted">Tier</th>
                            <th className="text-muted">Requests</th>
                            <th className="text-muted">Context Tokens</th>
                            <th className="text-muted">Auction Credits</th>
                            <th className="text-muted">Windows</th>
                        </tr>
                    </thead>
                    <tbody className="list">
                        {entries.map(([tier, config]) => (
                            <tr key={tier}>
                                <td>{formatName(tier)}</td>
                                <td>{formatValue(config.requestsPerBundle)}</td>
                                <td>{formatValue(config.maxContextLengthTokens)}</td>
                                <td>{formatValue(config.auctionCreditsMultiplier)}</td>
                                <td>
                                    Bid {formatValue(config.bidRevealDuration)} / Active{' '}
                                    {formatValue(config.activeAuctionDuration)} / Bundle{' '}
                                    {formatValue(config.bundleDuration)} / Settlement{' '}
                                    {formatValue(config.settlementWindowSlots)} / Result{' '}
                                    {formatValue(config.resultWindowSlots)} / Verify{' '}
                                    {formatValue(config.verificationWindowSlots)} / Claim{' '}
                                    {formatValue(config.claimWindowSlots)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TextRow({ label, value }: { label: string; value: unknown }) {
    return (
        <tr>
            <td>{label}</td>
            <td className="text-lg-end">{formatValue(value)}</td>
        </tr>
    );
}

function AddressRow({ label, value }: { label: string; value: string | undefined }) {
    return (
        <tr>
            <td>{label}</td>
            <td className="text-lg-end">
                <PubkeyValue value={value} link alignRight />
            </td>
        </tr>
    );
}

function EnumRow({ label, value }: { label: string; value: AuctionEnum | undefined }) {
    return (
        <tr>
            <td>{label}</td>
            <td className="text-lg-end">
                <EnumBadge value={value} />
            </td>
        </tr>
    );
}

function SlotRow({ label, value }: { label: string; value: number | undefined }) {
    return (
        <tr>
            <td>{label}</td>
            <td className="text-lg-end">{value ? <Slot slot={value} link /> : <Muted>None</Muted>}</td>
        </tr>
    );
}

function HashRow({
    label,
    base58,
    base64,
    placeholder,
}: {
    label: string;
    base58?: string;
    base64?: string;
    placeholder?: string;
}) {
    return (
        <tr>
            <td>{label}</td>
            <td className="text-lg-end">
                {placeholder ? (
                    <Muted>{placeholder}</Muted>
                ) : (
                    <>
                        <div className="font-monospace">{base58 || base64 || <Muted>None</Muted>}</div>
                        {base58 && base64 ? <div className="small text-muted">Base64: {base64}</div> : undefined}
                    </>
                )}
            </td>
        </tr>
    );
}

function ArrayRow({ label, values }: { label: string; values: unknown[] | undefined }) {
    return (
        <tr>
            <td>{label}</td>
            <td className="text-lg-end">
                {values && values.length > 0 ? (
                    <span className="font-monospace">{values.map(formatArrayValue).join(', ')}</span>
                ) : (
                    <Muted>None</Muted>
                )}
            </td>
        </tr>
    );
}

function IndexesRow({ label, indexes }: { label: string; indexes: number[] | undefined }) {
    return (
        <tr>
            <td>{label}</td>
            <td className="text-lg-end">
                <IndexBadges indexes={indexes} />
            </td>
        </tr>
    );
}

function PubkeyList({ values, indexes }: { values: string[] | undefined; indexes?: number[] }) {
    const indexed = valuesWithIndexes(values, indexes);
    if (indexed.length === 0) {
        return <Muted>None</Muted>;
    }

    return (
        <div className="d-inline-flex flex-column gap-1">
            {indexed.map(({ index, value }) => (
                <div className="d-flex align-items-center justify-content-end gap-2" key={`${index}-${value}`}>
                    <span className="badge bg-info-soft">#{index}</span>
                    <PubkeyValue value={value} link />
                </div>
            ))}
        </div>
    );
}

function PubkeyValue({ value, link, alignRight }: { value: string | undefined; link?: boolean; alignRight?: boolean }) {
    const pubkey = toPubkey(value);
    if (!pubkey) {
        return <Muted>None</Muted>;
    }
    return <Address pubkey={pubkey} link={link} alignRight={alignRight} raw />;
}

function EnumBadge({ value }: { value: AuctionEnum | undefined }) {
    if (!value) {
        return <Muted>Unknown</Muted>;
    }
    const terminal = value.terminal === true;
    return (
        <>
            <span className={`badge bg-${terminal ? 'success' : 'info'}-soft`}>{formatName(value.name)}</span>
            <span className="ms-2 text-muted">#{value.value}</span>
        </>
    );
}

function IndexBadges({ indexes }: { indexes: number[] | undefined }) {
    if (!indexes || indexes.length === 0) {
        return <Muted>None</Muted>;
    }
    return (
        <>
            {indexes.map(index => (
                <span className="badge bg-info-soft me-1" key={index}>
                    #{index}
                </span>
            ))}
        </>
    );
}

function VerifierRanges({ ranges, rewards }: { ranges: number[] | undefined; rewards: number[] | undefined }) {
    const rows = (rewards ?? [])
        .map((reward, index) => {
            const start = ranges?.[index * 2] ?? 0;
            const end = ranges?.[index * 2 + 1] ?? 0;
            return { end, index, reward, start };
        })
        .filter(({ start, end, reward }) => start !== 0 || end !== 0 || reward !== 0);

    if (rows.length === 0) {
        return <Muted>None</Muted>;
    }
    return (
        <div className="d-flex flex-column gap-1">
            {rows.map(({ index, start, end, reward }) => (
                <span className="font-monospace" key={index}>
                    #{index}: {formatValue(start)}-{formatValue(end)} / {formatValue(reward)}
                </span>
            ))}
        </div>
    );
}

function Muted({ children }: { children: React.ReactNode }) {
    return <span className="text-muted">{children}</span>;
}

function toPubkey(value: string | undefined): PublicKey | undefined {
    if (!value || value === DEFAULT_PUBKEY) {
        return undefined;
    }
    try {
        return new PublicKey(value);
    } catch {
        return undefined;
    }
}

function valuesWithIndexes(values: string[] | undefined, indexes: number[] | undefined) {
    if (!values) {
        return [];
    }
    const selected = indexes?.length
        ? indexes.map(index => ({ index, value: values[index] }))
        : values.map((value, index) => ({ index, value }));
    return selected.filter(({ value }) => Boolean(toPubkey(value)));
}

function formatName(value: string | undefined) {
    if (!value) {
        return 'Unknown';
    }
    return value.includes('_') ? snakeToTitleCase(value) : camelToTitleCase(value);
}

function formatValue(value: unknown) {
    if (value === undefined || value === null || value === '') {
        return 'None';
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value.toLocaleString('en-US') : String(value);
    }
    return String(value);
}

function formatArrayValue(value: unknown) {
    return typeof value === 'string' ? formatName(value) : formatValue(value);
}

function layoutVersionText(value: ConfigPolicyV2Info['v2AccountLayoutVersion']) {
    if (typeof value === 'string') {
        return value;
    }
    return `Invalid (${value.raw})`;
}

function lifecycleHashPlaceholder(info: BundleEscrowV2Info, hash: 'auction' | 'result' | 'verification') {
    const status = info.status?.value;
    if (!isZeroLifecycleHash(info, hash)) {
        return undefined;
    }

    if (hash === 'auction') {
        if (status === BUNDLE_STATUS.open) return 'Settlement not committed yet';
        if (status === BUNDLE_STATUS.expired) return 'Expired before settlement';
        return 'Zero hash';
    }

    if (hash === 'result') {
        if (status === BUNDLE_STATUS.open || status === BUNDLE_STATUS.awarded) return 'Result not posted yet';
        if (status === BUNDLE_STATUS.expired) {
            return isZeroLifecycleHash(info, 'auction') ? 'Expired before settlement' : 'Expired before result';
        }
        return 'Zero hash';
    }

    if (status === BUNDLE_STATUS.open || status === BUNDLE_STATUS.awarded || status === BUNDLE_STATUS.resultPosted) {
        return 'Verification not finalized yet';
    }
    if (status === BUNDLE_STATUS.expired) {
        if (isZeroLifecycleHash(info, 'auction')) return 'Expired before settlement';
        if (isZeroLifecycleHash(info, 'result')) return 'Expired before result';
        return 'Expired before verification';
    }
    return 'Zero hash';
}

function isZeroLifecycleHash(info: BundleEscrowV2Info, hash: 'auction' | 'result' | 'verification') {
    switch (hash) {
        case 'auction':
            return isZeroHash(info.auctionHashBase58, info.auctionHash);
        case 'result':
            return isZeroHash(info.resultHashBase58, info.resultHash);
        case 'verification':
            return isZeroHash(info.verificationHashBase58, info.verificationHash);
    }
}

function isZeroHash(base58: string | undefined, base64: string | undefined) {
    return base58 === DEFAULT_PUBKEY || base64 === ZERO_HASH_BASE64;
}
