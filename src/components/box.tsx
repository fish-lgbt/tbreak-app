import { cn } from '@/cn';

type BoxProps = {
	className?: string;
	style?: React.CSSProperties;
	children?: React.ReactNode;
	inverted?: boolean;
};

export const Box = ({ className, style, children, inverted = false }: BoxProps) => (
	<div
		className={cn(
			'rounded-sm',
			[inverted && 'bg-[#161B22] dark:bg-[#EBEDF0] text-white dark:text-black', !inverted && 'bg-[#EBEDF0] dark:bg-[#161B22]'],
			className
		)}
		style={style}
	>
		{children}
	</div>
);
