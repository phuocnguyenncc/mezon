import { ChannelMembersEntity, selectCurrentClan } from '@mezon/store-mobile';
import { UsersClanEntity } from '@mezon/utils';
import { memo } from 'react';
import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { MemberProfile } from '../MemberProfile';

interface IProps {
	user: ChannelMembersEntity;
	onPress?: (user: ChannelMembersEntity) => void;
	creatorChannelId?: string;
	isDMThread?: boolean;
}

type MemberItemProps = {
	user: ChannelMembersEntity | UsersClanEntity;
	isDMThread?: boolean;
	onPress?: (user: ChannelMembersEntity) => void;
	creatorChannelId?: string;
};

export const MemoizedMemberItem = memo((props: MemberItemProps) => {
	const { user, ...rest } = props;

	return <MemberItem {...rest} user={user} />;
});

export const MemberItem = memo(({ user, onPress, creatorChannelId, isDMThread }: IProps) => {
	const currentClan = useSelector(selectCurrentClan);

	return (
		<Pressable
			onPress={() => {
				onPress(user);
			}}
		>
			<MemberProfile
				user={user}
				numCharCollapse={30}
				nickName={user?.clan_nick}
				creatorClanId={currentClan?.creator_id}
				creatorDMId={creatorChannelId}
				isDMThread={isDMThread}
			/>
		</Pressable>
	);
});
