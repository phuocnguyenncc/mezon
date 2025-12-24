import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		confirmText: {
			color: colors.text,
			fontSize: size.medium,
			textAlign: 'center'
		},
		boldText: {
			fontWeight: 'bold'
		},
		headerTitle: {
			fontSize: size.s_18,
			marginLeft: 0,
			marginRight: 0,
			fontWeight: 'bold',
			color: colors.white
		},
		headerLeftContainer: {
			marginLeft: size.s_16
		},
		container: {
			flex: 1,
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_12
		}
	});
