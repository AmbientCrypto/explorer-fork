import FeatureGatesPageClient from './page-client';

export const metadata = {
    description: `Overview of the feature gates on Ambient`,
    title: `Feature Gates | Ambient`,
};

export default function FeatureGatesPage() {
    return <FeatureGatesPageClient />;
}
