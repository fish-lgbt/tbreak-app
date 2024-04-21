import { cn } from '@/cn';
import { Box } from './box';
import { Tooltip } from './tooltip';
import { formatNumberToHumanReadable } from '@/common/format-number';

type Period = 'day' | 'week' | 'fortnight' | 'month' | 'year';

type Stat = {
	date: Date;
	followers?: number;
	following?: number;
	tweets?: number;
	diff?: {
		followers: number;
		following: number;
		tweets: number;
	};
};

const ONE_HOUR = 1_000 * 60 * 60;
const ONE_DAY = ONE_HOUR * 24;

const periodToLength = {
	day: {
		time: ONE_HOUR,
		count: 24,
		rows: 4,
		columns: 6,
	},
	week: {
		time: ONE_DAY,
		count: 7,
		rows: 1,
		columns: 7,
	},
	fortnight: {
		time: ONE_DAY,
		count: 14,
		rows: 2,
		columns: 7,
	},
	month: {
		time: ONE_DAY,
		count: 31,
		rows: 5,
		columns: 6,
	},
	year: {
		time: ONE_DAY,
		count: 280,
		rows: 7,
		columns: 40,
	},
};

// We need to take into account the rows and columns
// 280 -> 0
// 239 -> 1
// 199 -> 2
// 159 -> 3
// 119 -> 4
// 79 -> 5
// 39 -> 6
// 0 -> 279
const invertIndex = (oldIndex: number, rows: number, columns: number) => {
	// Calculate the original row and column
	const originalRow = Math.floor(oldIndex / columns);
	const originalColumn = oldIndex % columns;

	// Flip the column so the last is the first and the first is the last
	const flippedColumn = columns - 1 - originalColumn;

	// The new index will be determined by taking the original column as the row
	// and the original row as the column, flipping the grid
	return flippedColumn * rows + (rows - 1 - originalRow);
};

type StatsBoxProps = {
	period: Period;
	stats: (Stat | undefined)[];
	type: 'followers' | 'following' | 'tweets';
	lables: {
		left: string[];
		top: string[];
	};
};

const shadeOfGreen = (percent: number) => {
	const g = percent > 50 ? 255 : Math.floor((percent * 2 * 255) / 100);
	return `rgb(0, ${g}, 0)`;
};

const numberToColour = (number: number, max: number) => {
	// Going from min to max, we want to go from 0 to 120 in the hue spectrum
	// Negative values will be red
	if (number < 0) {
		return 'red';
	}

	// 0 will be grey
	if (number === 0) {
		return '';
	}

	// Max will be green
	if (number === max) {
		return 'green';
	}

	// Shade of green
	return shadeOfGreen((number / max) * 100);
};

export const StatsBox = ({ period, stats, type, lables: { left, top } }: StatsBoxProps) => {
	const max = Math.max(...stats.filter(Boolean).map((stat) => stat?.diff?.[type] ?? 0));

	return (
		<div className="relative">
			{/* Left labels */}
			<div className="flex flex-col gap-1 absolute left-0 h-full justify-between py-5">
				{left.map((label) => (
					<span key={label} className="text-xs text-gray-500 dark:text-gray-400">
						{label}
					</span>
				))}
			</div>
			{/* Top labels */}
			<div className="flex flex-row gap-1 absolute top-0 transform w-full justify-between px-5">
				{top.map((label) => (
					<span key={label} className="text-xs text-gray-500 dark:text-gray-400">
						{label}
					</span>
				))}
			</div>
			{/* Stats */}
			<div
				className="grid grid-col grid-flow-row gap-1 border border-[#EBEDF0] dark:border-[#161B22] p-2 w-max ml-3 mt-4"
				style={{
					gridTemplateColumns: `repeat(${periodToLength[period].columns}, minmax(0, 1fr))`,
				}}
			>
				{Array.from({ length: periodToLength[period].count }).map((_, index) => {
					const invertedIndex = invertIndex(index, periodToLength[period].rows, periodToLength[period].columns);
					const stat = stats[invertedIndex];
					const diff = stat?.diff?.[type];
					const current = stat?.[type];
					return (
						<Tooltip
							tooltip={
								stat !== undefined && diff !== undefined ? (
									<div>
										{current && formatNumberToHumanReadable(current)} [
										<span
											className={cn([
												// Lost followers
												'text-red-500',
												// No change
												diff === 0 && 'text-white',
												// Gained followers
												diff >= 1 && 'text-green-500',
											])}
										>
											{plusOrMinus(diff)}

											{formatNumberToHumanReadable(diff)}
										</span>
										] on{' '}
										{new Date(stat.date).toLocaleDateString('en', {
											dateStyle: 'full',
										})}
									</div>
								) : (
									'No stats'
								)
							}
							key={invertedIndex}
						>
							<Box
								className={cn('size-3')}
								style={
									diff !== undefined
										? {
												backgroundColor: numberToColour(diff, max),
										  }
										: {}
								}
							/>
						</Tooltip>
					);
				})}
			</div>
		</div>
	);
};

const plusOrMinus = (number: number) => (number === 0 ? '' : number > 0 ? `+` : `-`);
