import { useParams } from 'react-router-dom';
import OrganizationDetail from '@/pages/organization-detail';
import OrganizationPublicProfile from '@/pages/organizations/[slug]';

export default function OrganizationRouter() {
    const { id } = useParams<{ id: string }>();

    // Simple heuristic: if it consists only of digits, treat as ID for the private/legacy view.
    // Otherwise, treat as slug for the public profile.
    const isNumeric = /^\d+$/.test(id || '');

    if (isNumeric) {
        return <OrganizationDetail />;
    }

    return <OrganizationPublicProfile />;
}
