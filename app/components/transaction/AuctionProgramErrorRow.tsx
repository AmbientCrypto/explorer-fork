export type ParsedProgramError = {
    program: string;
    programId: string;
    instructionIndex: number;
    code: number;
    name: string;
};

export function AuctionProgramErrorRow({ error }: { error?: ParsedProgramError }) {
    if (error?.program !== 'auction') {
        return null;
    }

    return (
        <tr>
            <td>Auction Error</td>
            <td className="text-lg-end">
                <h3 className="mb-0">
                    <span className="badge bg-warning-soft">
                        {error.name} (#{error.code})
                    </span>
                </h3>
            </td>
        </tr>
    );
}
