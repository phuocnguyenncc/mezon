import { selectTheme, useAppSelector } from '@mezon/store';
import { CSSProperties, useMemo } from 'react';

export function useMenuStyles(warningStatus: string) {
	const appearanceTheme = useAppSelector(selectTheme);
	const isLightMode = appearanceTheme === 'light';

	const menuStyles = useMemo(
		() =>
			({
				'--contexify-menu-bgColor': 'var(--bg-theme-contexify)',
				'--contexify-item-color': 'var(--text-theme-primary)',
				'--contexify-activeItem-bgColor': warningStatus || 'var(--bg-item-hover)',
				'--contexify-rightSlot-color': 'var(--text-secondary)',
				'--contexify-activeRightSlot-color': 'var(--text-secondary)',
				'--contexify-arrow-color': 'var(--text-theme-primary)',
				'--contexify-activeArrow-color': 'var(--text-secondary)',
				'--contexify-activeItem-radius': '6px'
			}) as CSSProperties,
		[warningStatus]
	);

	return { menuStyles, isLightMode };
}
