import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			paddingHorizontal: size.s_10,
			paddingBottom: size.s_14,
			borderBottomColor: colors.secondaryLight,
			borderBottomWidth: 1,
			maxHeight: '40%'
		},
		dateText: {
			fontSize: size.small,
			color: baseColor.gray
		},
		name: {
			fontSize: size.medium,
			fontWeight: '700'
		},
		title: {
			fontSize: size.label,
			color: colors.text,
			fontWeight: '700'
		},
		titlePanel: {
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			height: size.s_24,
			gap: size.s_6
		},
		userInfo: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10,
			marginVertical: size.s_10
		},
		headerPannel: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingVertical: size.s_6
		},
		backButton: {
			width: size.s_50,
			paddingVertical: size.s_4
		},
		spacer: {
			width: size.s_50
		},
		avatarWrapper: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			overflow: 'hidden'
		},
		nameWrapper: {
			flexDirection: 'row',
			gap: size.s_4,
			alignItems: 'center'
		},
		roleIcon: {
			width: size.s_16,
			height: size.s_16
		}
	});
