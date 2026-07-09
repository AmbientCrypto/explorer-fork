import { Badge } from '@components/shared/ui/badge';

export type ParsedProgramError = {
    program: string;
    programId: string;
    instructionIndex: number;
    code: number;
    name: string;
};

export function AuctionProgramErrorRow({ error }: { error?: ParsedProgramError }) {
    if (error?.program !== 'auction') {
        return undefined;
    }

    return (
        <div className="grid min-h-9 grid-cols-[clamp(100px,25%,200px)_1fr] items-baseline gap-2 border-1 border-b border-white/10 px-3 py-2.5 [border-bottom-style:solid] md:px-4">
            <div className="flex flex-wrap items-center gap-1 overflow-hidden text-sm text-outer-space-300">
                Auction Error
            </div>
            <div className="break-all font-mono text-sm text-white">
                <Badge ui="dashkit" variant="warning">
                    {error.name} (#{error.code})
                </Badge>
            </div>
        </div>
    );
}
