'use client';

import { Epoch } from '@components/common/Epoch';
import { ErrorCard } from '@components/common/ErrorCard';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { TimestampToggle } from '@components/common/TimestampToggle';
import { LiveTransactionStatsCard } from '@components/LiveTransactionStatsCard';
import { StatsNotReady } from '@components/StatsNotReady';
import { useCluster } from '@providers/cluster';
import { StatsProvider } from '@providers/stats';
import {
    ClusterStatsStatus,
    useDashboardInfo,
    usePerformanceInfo,
    useStatsProvider,
} from '@providers/stats/solanaClusterStats';
import { Status, SupplyProvider, useFetchSupply, useSupply } from '@providers/supply';
import { Connection, PublicKey } from '@solana/web3.js';
import { ClusterStatus } from '@utils/cluster';
import { abbreviatedNumber, lamportsToSol, slotsToHumanString } from '@utils/index';
import { percentage } from '@utils/math';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React from 'react';

import { Card, CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';
import type { AuctionActivitySummary } from '@/app/utils/auction-activity';
import {
    AUCTION_SIGNATURE_LIMIT,
    formatFailedSampled,
    formatSampledCount,
    formatWindowCount,
    shortenAuctionActivityError,
    summarizeAuctionActivity,
} from '@/app/utils/auction-activity';

import { SimpleCardSkeleton } from './components/shared/Skeletons';

const AUCTION_PROGRAM_ID = 'Auction111111111111111111111111111111111111';

export default function Page() {
    return (
        <StatsProvider>
            <SupplyProvider>
                <PageContainer className="mt-4">
                    <HomeStatsCards />

                    <div className="flex flex-col lg:flex-row lg:gap-6">
                        <div className="w-full lg:w-1/2">
                            <StatsCardBody />
                        </div>
                        <div className="w-full lg:w-1/2">
                            <LiveTransactionStatsCard />
                        </div>
                    </div>

                    <AmbientExplorerSection />
                </PageContainer>
            </SupplyProvider>
        </StatsProvider>
    );
}

const LoadingStatsCard = ({ title }: { title: string }) => {
    return (
        <div className="flex items-center gap-2">
            <span className="spinner-grow spinner-grow-sm shrink-0" />
            {title}
        </div>
    );
};

type AuctionActivityStats =
    | { status: 'idle' | 'loading' }
    | (AuctionActivitySummary & { status: 'ready' })
    | { message: string; status: 'error' };

function HomeStatsCards() {
    return (
        <div className="flex flex-col md:flex-row md:gap-6">
            <div className="w-full md:w-1/2">
                <SupplyCard />
            </div>
            <div className="w-full md:w-1/2">
                <AuctionProgramActivityCard />
            </div>
        </div>
    );
}

function SupplyCard() {
    const { status } = useCluster();
    const supply = useSupply();
    const fetchSupply = useFetchSupply();

    React.useEffect(() => {
        if (status === ClusterStatus.Connected) {
            fetchSupply();
        }
    }, [fetchSupply, status]);

    if (supply === Status.Disconnected) {
        return null;
    }

    if (supply === Status.Idle || supply === Status.Connecting) {
        return <SimpleCardSkeleton title={<LoadingStatsCard title="Loading supply data" />} />;
    } else if (typeof supply === 'string') {
        return <ErrorCard text={supply} retry={fetchSupply} />;
    }

    if (supply.circulating === BigInt(0) && supply.total === BigInt(0)) {
        return null;
    }

    const circulatingPercentage = percentage(supply.circulating, supply.total, 2).toFixed(1);

    return (
        <Card ui="dashkit" className="mb-3 md:mb-6">
            <CardBody ui="dashkit">
                <h4>Circulating Supply</h4>
                <h1 className="mb-3">
                    <em className="not-italic text-dark-accent">{displayLamports(supply.circulating)}</em> /{' '}
                    <small className="text-base">{displayLamports(supply.total)}</small>
                </h1>
                <h5 className="mb-0">
                    <em className="not-italic text-dark-accent">{circulatingPercentage}%</em> is circulating
                </h5>
            </CardBody>
        </Card>
    );
}

function AuctionProgramActivityCard() {
    const { status, url } = useCluster();
    const auctionProgramPath = useClusterPath({ pathname: `/address/${AUCTION_PROGRAM_ID}` });
    const [stats, setStats] = React.useState<AuctionActivityStats>({ status: 'idle' });

    React.useEffect(() => {
        if (status !== ClusterStatus.Connected) {
            return;
        }

        let cancelled = false;
        setStats({ status: 'loading' });

        new Connection(url, 'confirmed')
            .getSignaturesForAddress(new PublicKey(AUCTION_PROGRAM_ID), { limit: AUCTION_SIGNATURE_LIMIT })
            .then(signatures => {
                if (cancelled) {
                    return;
                }

                setStats({
                    ...summarizeAuctionActivity(signatures, Math.floor(Date.now() / 1000), AUCTION_SIGNATURE_LIMIT),
                    status: 'ready',
                });
            })
            .catch(error => {
                if (cancelled) {
                    return;
                }

                setStats({
                    message: shortenAuctionActivityError(
                        error instanceof Error ? error.message : 'Unable to load auction activity',
                    ),
                    status: 'error',
                });
            });

        return () => {
            cancelled = true;
        };
    }, [status, url]);

    return (
        <Card ui="dashkit" className="mb-3 md:mb-6">
            <CardBody ui="dashkit">
                <h4>Auction Program Activity</h4>
                {stats.status === 'ready' ? (
                    <>
                        <h1 className="mb-3">
                            <em className="not-italic text-dark-accent">{formatSampledCount(stats)}</em>{' '}
                            <small className="text-base">recent sampled txs</small>
                        </h1>
                        <h5 className="mb-0">
                            Sample window <em className="not-italic text-dark-accent">{stats.sampleWindowLabel}</em>
                        </h5>
                    </>
                ) : (
                    <LoadingStatsCard
                        title={stats.status === 'error' ? 'Auction activity unavailable' : 'Loading auction activity'}
                    />
                )}
            </CardBody>
            <TableCardBody layout="expanded" className="[&_td:first-child]:!w-2/5 md:[&_td:first-child]:!w-auto">
                <tr>
                    <td className="w-full">Program</td>
                    <td className="text-right font-mono">
                        <Link className="link" href={auctionProgramPath}>
                            Auction
                        </Link>
                    </td>
                </tr>
                {stats.status === 'ready' && (
                    <>
                        <tr>
                            <td className="w-full">Sample size</td>
                            <td className="text-right font-mono">{formatSampledCount(stats)}</td>
                        </tr>
                        <tr>
                            <td className="w-full">Last hour</td>
                            <td className="text-right font-mono">{formatWindowCount(stats.txs1h)}</td>
                        </tr>
                        <tr>
                            <td className="w-full">Last 24h</td>
                            <td className="text-right font-mono">{formatWindowCount(stats.txs24h)}</td>
                        </tr>
                        <tr>
                            <td className="w-full">Failed sampled txs</td>
                            <td className="text-right font-mono">{formatFailedSampled(stats)}</td>
                        </tr>
                        {stats.latestBlockTime !== undefined && (
                            <tr>
                                <td className="w-full">Latest activity</td>
                                <td className="text-right font-mono">
                                    <TimestampToggle unixTimestamp={stats.latestBlockTime} shorter />
                                </td>
                            </tr>
                        )}
                    </>
                )}
                {stats.status === 'error' && (
                    <tr>
                        <td className="w-full">Status</td>
                        <td className="text-right">{stats.message}</td>
                    </tr>
                )}
            </TableCardBody>
        </Card>
    );
}

function AmbientExplorerSection() {
    const auctionProgramPath = useClusterPath({ pathname: `/address/${AUCTION_PROGRAM_ID}` });
    const inspectorPath = useClusterPath({ pathname: '/tx/inspector' });

    return (
        <Card ui="dashkit" className="mb-3 md:mb-6">
            <CardHeader ui="dashkit">
                <CardTitle as="h4" ui="dashkit">
                    Ambient On-Chain Data
                </CardTitle>
            </CardHeader>
            <TableCardBody layout="expanded" className="[&_td:first-child]:!w-2/5 md:[&_td:first-child]:!w-auto">
                <tr>
                    <td className="w-full">Auction program</td>
                    <td className="text-right font-mono">
                        <Link className="link" href={auctionProgramPath}>
                            Ambient Auction Program
                        </Link>
                    </td>
                </tr>
                <tr>
                    <td className="w-full">Parsed accounts</td>
                    <td className="text-right">Bundle escrows, verifier pages, config policy</td>
                </tr>
                <tr>
                    <td className="w-full">Parsed transactions</td>
                    <td className="text-right">
                        <Link className="link" href={inspectorPath}>
                            Auction instructions and errors
                        </Link>
                    </td>
                </tr>
                <tr>
                    <td className="w-full">Reward model</td>
                    <td className="text-right">Ambient LStake auction rewards</td>
                </tr>
            </TableCardBody>
        </Card>
    );
}

function displayLamports(value: number | bigint) {
    return abbreviatedNumber(lamportsToSol(value));
}

function StatsCardBody() {
    const dashboardInfo = useDashboardInfo();
    const performanceInfo = usePerformanceInfo();
    const { setActive } = useStatsProvider();
    const { cluster } = useCluster();

    React.useEffect(() => {
        setActive(true);
        return () => setActive(false);
    }, [setActive, cluster]);

    if (performanceInfo.status !== ClusterStatsStatus.Ready || dashboardInfo.status !== ClusterStatsStatus.Ready) {
        const error =
            performanceInfo.status === ClusterStatsStatus.Error || dashboardInfo.status === ClusterStatsStatus.Error;
        return <StatsNotReady error={error} />;
    }

    const { avgSlotTime_1h, avgSlotTime_1min, epochInfo, blockTime } = dashboardInfo;
    const hourlySlotTime = Math.round(1000 * avgSlotTime_1h);
    const averageSlotTime = Math.round(1000 * avgSlotTime_1min);
    const { slotIndex, slotsInEpoch } = epochInfo;
    const epochProgress = `${percentage(slotIndex, slotsInEpoch, 2).toFixed(1)}%`;
    const epochTimeRemaining = slotsToHumanString(Number(slotsInEpoch - slotIndex), hourlySlotTime);
    const { blockHeight, absoluteSlot } = epochInfo;

    return (
        <Card ui="dashkit" flex="grow" className="mb-3 md:mb-6">
            <CardHeader ui="dashkit">
                <CardTitle as="h4" ui="dashkit">
                    Live Cluster Stats
                </CardTitle>
            </CardHeader>
            <TableCardBody layout="expanded" className="[&_td:first-child]:!w-2/5 md:[&_td:first-child]:!w-auto">
                <tr>
                    <td className="w-full">Slot</td>
                    <td className="text-right font-mono">
                        <Slot slot={absoluteSlot} link />
                    </td>
                </tr>
                {blockHeight !== undefined && (
                    <tr>
                        <td className="w-full">Block height</td>
                        <td className="text-right font-mono">
                            <Slot slot={blockHeight} />
                        </td>
                    </tr>
                )}
                {blockTime && (
                    <tr>
                        <td className="w-full">Cluster time</td>
                        <td className="text-right font-mono">
                            <TimestampToggle unixTimestamp={blockTime} shorter></TimestampToggle>
                        </td>
                    </tr>
                )}
                <tr>
                    <td className="w-full">Slot time (1min average)</td>
                    <td className="text-right font-mono">{averageSlotTime}ms</td>
                </tr>
                <tr>
                    <td className="w-full">Slot time (1hr average)</td>
                    <td className="text-right font-mono">{hourlySlotTime}ms</td>
                </tr>
                <tr>
                    <td className="w-full">Epoch</td>
                    <td className="text-right font-mono">
                        <Epoch epoch={epochInfo.epoch} link />
                    </td>
                </tr>
                <tr>
                    <td className="w-full">Epoch progress</td>
                    <td className="text-right font-mono">{epochProgress}</td>
                </tr>
                <tr>
                    <td className="w-full">Epoch time remaining (approx.)</td>
                    <td className="text-right font-mono">~{epochTimeRemaining}</td>
                </tr>
            </TableCardBody>
        </Card>
    );
}
