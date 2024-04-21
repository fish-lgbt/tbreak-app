import { formatNumberToHumanReadable } from '@/common/format-number';
import nodeToText from 'react-to-text';

export const ScaledNumber = ({ children }: { children: React.ReactNode }) => {
	const text = nodeToText(children);
	const number = Number(text);
	return formatNumberToHumanReadable(number);
};
