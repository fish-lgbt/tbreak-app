export const formatNumberToHumanReadable = (number: number) => {
	const num = Math.abs(number);

	if (num < 1_000) {
		return num;
	}

	if (num < 1_000_000) {
		return `${(num / 1_000).toFixed(1)}K`;
	}

	return `${(num / 1_000_000).toFixed(1)}M`;
};
