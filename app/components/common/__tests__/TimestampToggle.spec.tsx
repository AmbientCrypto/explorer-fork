import { render, screen } from '@testing-library/react';

import { TimestampToggle } from '../TimestampToggle';

describe('TimestampToggle', () => {
    it('should render unix timestamps as seconds, not milliseconds', () => {
        const { container } = render(<TimestampToggle unixTimestamp={1_717_891_200} shorter />);

        expect(screen.getByText('Jun 9, 2024 at 00:00:00 UTC')).toBeInTheDocument();
        expect(container.textContent).not.toContain('1970');
    });
});
