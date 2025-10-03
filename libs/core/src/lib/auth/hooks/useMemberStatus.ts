import { selectUserStatusById, useAppSelector } from '@mezon/store';
import { EUserStatus } from '@mezon/utils';

export function useMemberStatus(memberId: string) {
	const memberStatus = useAppSelector((state) => selectUserStatusById(state, memberId));
	return {
		status: memberStatus?.online ? (memberStatus.user_status as EUserStatus) : EUserStatus.INVISIBLE,
		user_status: memberStatus?.user_status,
		isMobile: false
	};
}
