import type { ParsedData } from '@providers/accounts';

const TOKEN_TABS_HIDDEN = ['spl-token:mint', 'spl-token-2022:mint', 'config', 'vote', 'sysvar', 'auction'];

export function showGenericAccountTabs(parsedData: ParsedData | undefined, programTypeKey: string) {
    return (
        !parsedData || !(TOKEN_TABS_HIDDEN.includes(parsedData.program) || TOKEN_TABS_HIDDEN.includes(programTypeKey))
    );
}
