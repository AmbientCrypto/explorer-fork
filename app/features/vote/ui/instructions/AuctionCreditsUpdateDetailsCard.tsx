import { InstructionCard } from '@components/instruction/InstructionCard';

import type { AuctionCreditsUpdateInfo } from '../../lib/instruction-types';
import { DetailRow, VoteProgramRow } from './DetailRow';
import type { VoteCardProps } from './types';

export function AuctionCreditsUpdateDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: VoteCardProps<AuctionCreditsUpdateInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Vote: Auction Credits Update"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <VoteProgramRow />
            <DetailRow label="Vote Account" pubkey={info.voteAccount} />
            <DetailRow label="Vote Authority" pubkey={info.voteAuthority} />
            <DetailRow label="Auction Credits" monospace>
                {info.auctionCreditsUpdate.credits.toLocaleString('en-US')}
            </DetailRow>
        </InstructionCard>
    );
}
