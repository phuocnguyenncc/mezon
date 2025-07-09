import { useRoles } from '@mezon/core';
import {
	getNewAddMembers,
	getSelectedRoleId,
	RolesClanEntity,
	selectAllUserClans,
	selectCurrentClan,
	selectCurrentRoleIcon,
	setAddMemberRoles
} from '@mezon/store';
import { Icons, InputField } from '@mezon/ui';
import { createImgproxyUrl, getAvatarForPrioritize, getNameForPrioritize, UsersClanEntity } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';
import { AddMembersModal } from '../AddMembersModal';

const SettingManageMembers = ({ RolesClan, hasPermissionEdit }: { RolesClan: RolesClanEntity[]; hasPermissionEdit: boolean }) => {
	const { updateRole } = useRoles();
	const dispatchRole = useDispatch();
	const currentClan = useSelector(selectCurrentClan);
	const addUsers: string[] = useSelector(getNewAddMembers);
	const clickRole = useSelector(getSelectedRoleId);
	const usersClan = useSelector(selectAllUserClans);
	const [searchTerm, setSearchTerm] = useState('');
	const [openModal, setOpenModal] = useState<boolean>(false);
	const activeRole = RolesClan.find((role) => role.id === clickRole);
	const commonUsers = usersClan.filter((user) => addUsers.includes(user.id));
	const currentRoleIcon = useSelector(selectCurrentRoleIcon);

	const [searchResults, setSearchResults] = useState<any[]>(commonUsers);
	const handleOpenModal = () => {
		setOpenModal(true);
	};

	const handleCloseModal = () => {
		setOpenModal(false);
	};

	useEffect(() => {
		const results = commonUsers.filter((member) => {
			const clanName = member?.clan_nick?.toLowerCase();
			const displayName = member.user?.display_name?.toLowerCase();
			const username = member.user?.username?.toLowerCase();
			const lowerCaseSearchTerm = searchTerm.toLowerCase();
			return clanName?.includes(lowerCaseSearchTerm) || displayName?.includes(lowerCaseSearchTerm) || username?.includes(lowerCaseSearchTerm);
		});
		setSearchResults(results || []);
	}, [searchTerm, addUsers, clickRole]);

	const isNewRole = clickRole === 'New Role';
	useEffect(() => {
		if (!isNewRole) {
			const memberIDRoles = activeRole?.role_user_list?.role_users?.map((member) => member.id) || [];
			dispatchRole(setAddMemberRoles(memberIDRoles));
		}
	}, [activeRole, clickRole, dispatchRole]);

	const handleRemoveMember = async (userID: string) => {
		const userIDArray = userID?.split(',');
		await updateRole(
			currentClan?.id ?? '',
			clickRole,
			activeRole?.title ?? '',
			activeRole?.color ?? '',
			[],
			[],
			userIDArray,
			[],
			currentRoleIcon
		);
	};
	return (
		<div>
			<div className="w-full flex gap-x-3 pr-5">
				<InputField
					className="flex-grow text-[15px] w-full py-1 px-2 font-normal border-theme-primary bg-input-secondary"
					type="text"
					placeholder="Search Members"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
				<button
					className="flex-grow text-[15px] bg-indigo-500 hover:bg-indigo-600 rounded-lg py-[3px] px-2 text-nowrap font-medium text-white"
					onClick={() => {
						handleOpenModal();
					}}
				>
					Add Members
				</button>
			</div>
			<br />
			<ul className="flex flex-col gap-y-4 max-h-listMemberRole overflow-y-auto thread-scroll">
				{searchResults.map((member: UsersClanEntity) => (
					<ItemMember
						key={member?.user?.id}
						id={member?.user?.id}
						username={member?.user?.username}
						displayName={member?.user?.display_name}
						clanName={member?.clan_nick}
						clanAvatar={member.clan_avatar}
						avatar={member?.user?.avatar_url}
						isNewRole={isNewRole}
						onRemove={() => handleRemoveMember(member?.user?.id || '')}
					/>
				))}
			</ul>
			<AddMembersModal isOpen={openModal} onClose={handleCloseModal} RolesClan={RolesClan} />
		</div>
	);
};

export default SettingManageMembers;

type ItemMemberProps = {
	id?: string;
	username?: string;
	displayName?: string;
	clanName?: string;
	clanAvatar?: string;
	avatar?: string;
	isNewRole: boolean;
	onRemove: () => void;
};

const ItemMember = (props: ItemMemberProps) => {
	const { id = '', username = '', displayName = '', clanName = '', clanAvatar = '', avatar = '', isNewRole, onRemove } = props;
	const namePrioritize = getNameForPrioritize(clanName, displayName, username);
	const avatarPrioritize = getAvatarForPrioritize(clanAvatar, avatar);
	return (
		<li key={id} className="flex justify-between items-center">
			<div className="flex gap-x-2">
				<AvatarImage
					alt={username}
					username={username}
					className="min-w-6 min-h-6 max-w-6 max-h-6"
					srcImgProxy={createImgproxyUrl(avatarPrioritize ?? '')}
					src={avatarPrioritize}
				/>
				<span className="font-medium one-line">{namePrioritize}</span>
				<span className="font-light">{username}</span>
			</div>
			{!isNewRole ? (
				<div
					onClick={onRemove}
					className="w-4 h-4 rounded-full flex justify-center items-center mr-5 cursor-pointer text-theme-primary-hover"
				>
					<Icons.Close defaultSize="size-2 " />
				</div>
			) : null}
		</li>
	);
};
