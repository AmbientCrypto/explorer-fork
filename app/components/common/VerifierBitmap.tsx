import { Badge } from '@components/shared/ui/badge';
import React from 'react';

const BIT_INDEXES = Array.from({ length: 8 }, (_, index) => 7 - index);

export function VerifierBitmap({ value }: { value: number }) {
    const setIndexes = BIT_INDEXES.filter(index => (value & (1 << index)) !== 0).reverse();
    const binary = BIT_INDEXES.map(index => ((value & (1 << index)) !== 0 ? '1' : '0')).join('');
    const description = `Bitmap ${binary}, decimal ${value}; set verifier indexes ${setIndexes.join(', ') || 'none'}`;

    return (
        <span
            className="inline-flex flex-wrap items-center gap-1 text-left"
            aria-label={description}
            title={description}
        >
            <span className="font-mono text-dk-xs">
                0b{binary} <span className="text-dark-muted-foreground">({value})</span>
            </span>
            {setIndexes.length > 0 ? (
                setIndexes.map(index => (
                    <Badge ui="dashkit" variant="info" key={index}>
                        #{index}
                    </Badge>
                ))
            ) : (
                <span className="text-dk-xs text-dark-muted-foreground">None</span>
            )}
        </span>
    );
}
