import { STORAGE_AGE_RESTRICTED_CHANNEL_IDS, load } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity, selectAllAccount, selectCurrentChannel } from '@mezon/store-mobile';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import AgeRestricted from './AgeRestricted';
import AgeRestrictedForm from './AgeRestrictedForm';

const AgeRestrictedModal = () => {
	const [isShowAgeRestricted, setIsShowAgeRestricted] = useState(false);
	const currentChannel = useSelector(selectCurrentChannel);
	const userProfile = useSelector(selectAllAccount);
	const { themeValue } = useTheme();
	useEffect(() => {
		const savedChannelIds = load(STORAGE_AGE_RESTRICTED_CHANNEL_IDS) || [];
		if (!savedChannelIds?.includes(currentChannel?.channel_id) && (currentChannel as ChannelsEntity)?.age_restricted === 1) {
			setIsShowAgeRestricted(true);
		} else {
			setIsShowAgeRestricted(false);
		}
	}, [currentChannel]);

	const closeBackdrop = () => {
		setIsShowAgeRestricted(false);
	};
	if (!isShowAgeRestricted) return <View></View>;

	return (
		<View
			style={{
				flex: 1,
				position: 'absolute',
				width: '100%',
				height: '100%',
				zIndex: 99,
				top: 0,
				left: 0,
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: themeValue.secondary
			}}
		>
			{userProfile?.user?.dob === '0001-01-01T00:00:00Z' ? (
				<AgeRestrictedForm onClose={closeBackdrop} />
			) : (
				<AgeRestricted onClose={closeBackdrop} />
			)}
		</View>
	);
};

export default React.memo(AgeRestrictedModal);
