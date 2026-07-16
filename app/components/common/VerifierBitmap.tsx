import { Badge } from '@components/shared/ui/badge';
import React from 'react';

const BIT_INDEXES = Array.from({ length: 8 }, (_, index) => 7 - index);

export function VerifierBitmap({ value }: { value: number }) {
    const setIndexes = BIT_INDEXES.filter(index => (value & (1 << index)) !== 0).reverse();
    const binary = BIT_INDEXES.map(index => ((value & (1 << index)) !== 0 ? '1' : '0')).join('');
    const description = `Bitmap ${binary}, decimal ${value}; set verifier indexes ${setIndexes.join(', ') || 'none'}`;

    return (
        <span className="inline-grid gap-1 text-left" aria-label={description} title={description}>
            <span className="inline-flex items-center gap-1">
                <span className="mr-1 font-mono text-dk-xs text-dark-muted-foreground">0b</span>
                {BIT_INDEXES.map(index => {
                    const set = (value & (1 << index)) !== 0;
                    return (
                        <span
                            className={`inline-flex h-5 w-4 items-center justify-center rounded-sm border font-mono text-dk-xs ${
                                set
                                    ? 'border-dk-info bg-[#1e5159] text-white'
                                    : 'border-dk-card-outline-dark text-dark-muted-foreground'
                            }`}
                            key={index}
                            title={`Verifier #${index}: ${set ? 'set' : 'not set'}`}
                        >
                            {set ? '1' : '0'}
                        </span>
                    );
                })}
                <span className="ml-1 font-mono text-dk-xs text-dark-muted-foreground">({value})</span>
            </span>
            <span className="inline-flex flex-wrap items-center gap-1">
                <span className="mr-1 text-dk-xs text-dark-muted-foreground">Set</span>
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
        </span>
    );
}
