'use client';
import { cn } from '@/cn';
import { useState } from 'react';
import { Box } from './box';

type TooltipProps = {
	children: React.ReactNode;
	tooltip: React.ReactNode;
};

export const Tooltip = ({ children, tooltip }: TooltipProps) => {
	const [isActive, setIsActive] = useState(false);
	return (
		<div className="relative">
			<div
				onTouchEnd={() => void setIsActive(!isActive)}
				onMouseEnter={() => void setIsActive(true)}
				onMouseLeave={() => void setIsActive(false)}
			>
				{children}
			</div>
			<Box
				className={cn(
					// Style
					'px-3 py-2 text-sm font-medium text-[#161B22] dark:text-[#EBEDF0] shadow-sm border border-gray-300 dark:border-gray-500',

					// Animation
					'transition-opacity duration-300',

					// Size
					'w-[250px]',

					// Positioning
					'left-1/2 transform -translate-x-1/2 -translate-y-[120%] absolute z-10 inline-block',

					// Visibility on hover/touch
					!isActive && 'invisible opacity-0',
					isActive && 'visible opacity-100'
				)}
			>
				{tooltip}
			</Box>
		</div>
	);
};
