import { Address } from '@components/common/Address';
import { AuctionJobId } from '@components/common/AuctionJobId';
import { InstructionDetailsProps } from '@features/transaction/ui/InstructionsSection';
import { PublicKey } from '@solana/web3.js';
import { camelToTitleCase, snakeToTitleCase } from '@utils/index';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create } from 'superstruct';

import { InstructionCard } from '../InstructionCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';

type AuctionDetailsProps = InstructionDetailsProps & {
    InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
};

export function AuctionDetailsCard(props: AuctionDetailsProps) {
    try {
        const parsed = create(props.ix.parsed, ParsedInfo);
        const Card = props.InstructionCardComponent ?? InstructionCard;
        return (
            <Card {...props} title={`Auction: ${snakeToTitleCase(parsed.type)}`}>
                <tr>
                    <td>Program</td>
                    <td className="text-lg-end">
                        <Address pubkey={props.ix.programId} alignRight link />
                    </td>
                </tr>
                {Object.entries(parsed.info).map(([key, value]) => (
                    <tr key={key}>
                        <td>{snakeToTitleCase(key)}</td>
                        <td className="text-lg-end">{renderValue(key, value)}</td>
                    </tr>
                ))}
            </Card>
        );
    } catch {
        // Fall through to the generic parsed-instruction view.
    }

    return <UnknownDetailsCard {...props} InstructionCardComponent={props.InstructionCardComponent} />;
}

function renderValue(key: string, value: unknown): React.ReactNode {
    if (value === null || value === undefined) {
        return <span className="text-muted">None</span>;
    }
    if (typeof value === 'number') {
        return value.toLocaleString('en-US');
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    if (typeof value === 'string') {
        if (key === 'job_id') {
            return <AuctionJobId value={value} />;
        }
        if (key.includes('hash')) {
            return <pre className="d-inline-block data-wrap mb-0 text-start">{value}</pre>;
        }
        const pubkey = isAddressField(key) ? toPubkey(value) : undefined;
        return pubkey ? <Address pubkey={pubkey} alignRight link raw /> : value;
    }
    if (Array.isArray(value)) {
        if (key === 'page_entries') {
            return <PageEntriesTable entries={value as Record<string, unknown>[]} />;
        }
        if (key === 'tier_configs') {
            return <TierConfigsTable configs={value as Record<string, unknown>[]} />;
        }
        if (value.every(item => typeof item === 'string' && toPubkey(item))) {
            return <AddressList values={value as string[]} />;
        }
        return <span className="font-monospace">{value.map(String).join(', ')}</span>;
    }
    if (typeof value === 'object' && 'name' in value) {
        const named = value as { name?: string; value?: number };
        return (
            <>
                <span>{formatName(named.name)}</span>
                {named.value !== undefined ? <span className="ms-2 text-muted">#{named.value}</span> : undefined}
            </>
        );
    }
    if (typeof value === 'object') {
        return <pre className="d-inline-block data-wrap mb-0 text-start">{JSON.stringify(value, undefined, 2)}</pre>;
    }
    return String(value);
}

function PageEntriesTable({ entries }: { entries: Record<string, unknown>[] }) {
    if (entries.length === 0) {
        return <span className="text-muted">None</span>;
    }
    return (
        <table className="table-sm mb-0 table">
            <thead>
                <tr>
                    <th className="text-muted">Job</th>
                    <th className="text-muted">Posted</th>
                    <th className="text-muted">Accepted</th>
                    <th className="text-muted">Verdict</th>
                    <th className="text-muted">Claimed Bitmap</th>
                </tr>
            </thead>
            <tbody>
                {entries.map((entry, index) => (
                    <tr key={index}>
                        <td>{renderValue('job_id', entry.job_id)}</td>
                        <td>{renderValue('posted_output_tokens', entry.posted_output_tokens)}</td>
                        <td>{renderValue('accepted_output_tokens', entry.accepted_output_tokens)}</td>
                        <td>{renderValue('verdict', entry.verdict)}</td>
                        <td>{renderValue('verifier_claimed_bitmap', entry.verifier_claimed_bitmap)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function TierConfigsTable({ configs }: { configs: Record<string, unknown>[] }) {
    if (configs.length === 0) {
        return <span className="text-muted">None</span>;
    }
    return (
        <table className="table-sm mb-0 table">
            <thead>
                <tr>
                    <th className="text-muted">#</th>
                    <th className="text-muted">Requests</th>
                    <th className="text-muted">Context Tokens</th>
                    <th className="text-muted">Claim Window</th>
                </tr>
            </thead>
            <tbody>
                {configs.map((config, index) => (
                    <tr key={index}>
                        <td>{index}</td>
                        <td>{renderValue('requests_per_bundle', config.requests_per_bundle)}</td>
                        <td>{renderValue('max_context_length_tokens', config.max_context_length_tokens)}</td>
                        <td>{renderValue('claim_window_slots', config.claim_window_slots)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function AddressList({ values }: { values: string[] }) {
    return (
        <div className="d-inline-flex flex-column gap-1">
            {values.map(value => (
                <span key={value}>
                    <Address pubkey={new PublicKey(value)} alignRight link raw />
                </span>
            ))}
        </div>
    );
}

function toPubkey(value: string): PublicKey | undefined {
    try {
        return new PublicKey(value);
    } catch {
        return undefined;
    }
}

function isAddressField(key: string) {
    return (
        key.endsWith('_account') ||
        key.endsWith('_program') ||
        key.endsWith('_authority') ||
        key.endsWith('_recipient') ||
        key.endsWith('_escrow') ||
        key.endsWith('_payer') ||
        key.endsWith('_node') ||
        key === 'payer' ||
        key === 'authority' ||
        key === 'coordinator'
    );
}

function formatName(value: string | undefined) {
    if (!value) {
        return 'Unknown';
    }
    return value.includes('_') ? snakeToTitleCase(value) : camelToTitleCase(value);
}
