import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import VerifiedBuildClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `Contents of the verified build info for the program with address ${props.params.address} on Ambient`,
        title: `Verified Build | ${await getReadableTitleFromAddress(props)} | Ambient`,
    };
}

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export default function VerifiedBuildPage(props: Props) {
    return <VerifiedBuildClient {...props} />;
}
