import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapperOption: {
			flexDirection: 'row',
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_16,
			alignItems: 'center',
			justifyContent: 'space-between',
			borderTopColor: '#3b3d44',
			borderTopWidth: 0.2
		},
		textOption: {
			color: colors.text,
			fontSize: size.s_14,
			fontWeight: '500',
			maxWidth: size.s_200
		},
		content: {
			flexDirection: 'row',
			alignItems: 'center'
		}
	});
