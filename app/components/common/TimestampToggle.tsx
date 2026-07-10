'use client';

import { displayTimestamp, displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import { useState } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';

export function TimestampToggle({ unixTimestamp, shorter }: { unixTimestamp: number; shorter?: boolean }) {
    const [isUtc, setIsUtc] = useState(true);
    const timestampMs = unixTimestampToMs(unixTimestamp);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="w-full cursor-pointer" onClick={() => setIsUtc(prev => !prev)}>
                    {isUtc ? displayTimestampUtc(timestampMs, shorter) : displayTimestamp(timestampMs, shorter)}
                </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-80">
                (Click to toggle between local and UTC)
            </TooltipContent>
        </Tooltip>
    );
}
