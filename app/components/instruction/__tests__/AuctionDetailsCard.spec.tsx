import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { AuctionDetailsCard } from '@components/instruction/auction/AuctionDetailsCard';
import { AuctionProgramErrorRow } from '@features/transaction/ui/AuctionProgramErrorRow';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { expect, test, vi } from 'vitest';

import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';
import { AUCTION_PROGRAM_ID } from '@/app/validators/accounts/auction';

vi.mock('next/navigation');
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({
        cluster: 0,
        status: 0,
        url: 'http://localhost:8899',
    }),
}));

// @ts-expect-error does not contain `mockReturnValue`
useSearchParams.mockReturnValue({
    get: () => 'mainnet-beta',
    has: () => false,
    toString: () => '',
});

test('should render parsed auction v2 instruction details', () => {
    const programId = new PublicKey(AUCTION_PROGRAM_ID);
    const bundleEscrow = '11111111111111111111111111111112';

    render(
        <ScrollAnchorProvider>
            <AuctionDetailsCard
                ix={
                    {
                        parsed: {
                            info: {
                                accepted_output_tokens: 8,
                                bundle_escrow: bundleEscrow,
                                page_entries: [
                                    {
                                        accepted_output_tokens: 8,
                                        job_id: '11111111111111111111111111111113',
                                        posted_output_tokens: 9,
                                        verdict: { name: 'verified', value: 1 },
                                        verifier_claimed_bitmap: 2,
                                    },
                                ],
                                result_hash: 'result-hash-base64',
                            },
                            type: 'post_bundle_result_v2',
                        },
                        program: 'auction',
                        programId,
                    } as any
                }
                index={0}
                result={{ err: null }}
                tx={{ signatures: ['signature'] } as any}
                InstructionCardComponent={BaseInstructionCard}
            />
        </ScrollAnchorProvider>,
    );

    expect(screen.getByText('Auction: Post Bundle Result V2')).toBeInTheDocument();
    expect(screen.getByText('Page Entries')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('result-hash-base64')).toBeInTheDocument();
});

test('should render auction parsed program errors only for auction failures', () => {
    const { rerender } = render(
        <AuctionProgramErrorRow
            error={{
                code: 68,
                instructionIndex: 0,
                name: 'ClaimDeadlinePassed',
                program: 'auction',
                programId: AUCTION_PROGRAM_ID,
            }}
        />,
    );

    expect(screen.getByText('Auction Error')).toBeInTheDocument();
    expect(screen.getByText('ClaimDeadlinePassed (#68)')).toBeInTheDocument();

    rerender(
        <AuctionProgramErrorRow
            error={{
                code: 1,
                instructionIndex: 0,
                name: 'Other',
                program: 'system',
                programId: '11111111111111111111111111111111',
            }}
        />,
    );

    expect(screen.queryByText('Auction Error')).not.toBeInTheDocument();
});
