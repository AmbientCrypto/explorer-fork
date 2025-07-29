import SupplyPageClient from './page-client';

export const metadata = {
    description: `Overview of the native token supply on Ambient`,
    title: `Supply Overview | Ambient`,
};

export default function SupplyPage() {
    return <SupplyPageClient />;
}
