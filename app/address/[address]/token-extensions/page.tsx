import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import TokenExtensionsEntriesPageClient, { Props } from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `Token extensions information for address ${props.params.address} on Ambient`,
        title: `Token Extensions | ${await getReadableTitleFromAddress(props)} | Ambient`,
    };
}

export default function TokenExtensionsPage(props: Props) {
    return <TokenExtensionsEntriesPageClient {...props} />;
}
