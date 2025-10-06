import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useTheme } from '@mezon/mobile-ui';
import { channelMembersActions, ChannelMembersEntity, ChannelsEntity, directActions, useAppDispatch } from '@mezon/store-mobile';
import React from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps } from '../../../../../../../componentUI/MezonMenu';

export default function UserInfoDm({
	user,
	currentChannel,
	isShowRemoveGroup = true
}: {
	user: ChannelMembersEntity;
	currentChannel: ChannelsEntity;
	isShowRemoveGroup: boolean;
}) {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['userProfile']);
	const { dismiss } = useBottomSheetModal();
	const dispatch = useAppDispatch();

	const settingsMenu: IMezonMenuItemProps[] = [
		{
			title: t('userInfoDM.menu.removeFromGroup'),
			onPress: () => {
				handleRemoveMemberChannel();
			},
			styleBtn: { backgroundColor: themeValue.bgInputPrimary },
			isShow: isShowRemoveGroup
		}
	];

	const handleRemoveMemberChannel = async () => {
		if (user) {
			dismiss();
			const userIds = [user?.id ?? ''];
			try {
				const response = await dispatch(channelMembersActions.removeMemberChannel({ channelId: currentChannel?.channel_id, userIds }));
				if (response?.meta?.requestStatus === 'rejected') {
					throw new Error('removeMemberChannel failed');
				} else {
					Toast.show({
						type: 'info',
						text1: t('userInfoDM.menu.removeSuccess')
					});
					dispatch(directActions.fetchDirectMessage({ noCache: true }));
				}
			} catch (error) {
				console.error('Error removing member from channel:', error);
				Toast.show({
					type: 'info',
					text1: t('userInfoDM.menu.removeFailed')
				});
			}
		}
	};

	const menu: IMezonMenuSectionProps[] = [
		{
			items: settingsMenu
		}
	];

	return <MezonMenu menu={menu} />;
}
