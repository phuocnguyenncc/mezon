import { useAppParams, useAuth, useChatReaction, useEmojiConverted } from '@mezon/core';
import {
	selectClanView,
	selectClickedOnTopicStatus,
	selectCurrentChannel,
	selectCurrentTopicId,
	selectMessageByMessageId,
	selectTheme,
	useAppSelector
} from '@mezon/store';
import { ContextMenuItem, IEmoji, IMessageWithUser, SHOW_POSITION, isPublicChannel } from '@mezon/utils';
import { Dropdown } from 'flowbite-react';
import { useCallback, useMemo, useState } from 'react';
import { Item, Menu, Separator, Submenu } from 'react-contexify';
import { useSelector } from 'react-redux';
import { useMessageContextMenu } from './MessageContextMenuContext';
import ReactionItem from './ReactionItem';
import ReactionPart from './ReactionPart';

type Props = {
	menuId: string;
	items: ContextMenuItem[];
	messageId: string;
	message: IMessageWithUser;
	isTopic: boolean;
};

export default function DynamicContextMenu({ menuId, items, messageId, message, isTopic }: Props) {
	const appearanceTheme = useSelector(selectTheme);
	const emojiConverted = useEmojiConverted();

	const { directId } = useAppParams();

	const { reactionMessageDispatch } = useChatReaction();
	const userId = useAuth();
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);
	const currenTopicId = useSelector(selectCurrentTopicId);

	const isClanView = useSelector(selectClanView);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentMessage = useAppSelector((state) =>
		selectMessageByMessageId(state, isFocusTopicBox ? currenTopicId : currentChannel?.channel_id, messageId || '')
	);
	const handleClickEmoji = useCallback(
		async (emojiId: string, emojiShortCode: string) => {
			await reactionMessageDispatch({
				id: emojiId,
				messageId,
				emoji_id: emojiId,
				emoji: emojiShortCode,
				count: 1,
				message_sender_id: userId.userId ?? '',
				action_delete: false,
				is_public: isPublicChannel(currentChannel),
				clanId: currentChannel?.clan_id ?? '',
				channelId: isTopic ? currentChannel?.id || '' : (message?.channel_id ?? ''),
				isFocusTopicBox,
				channelIdOnMessage: currentMessage?.channel_id
			});
		},
		[messageId, currentChannel, directId, isClanView, reactionMessageDispatch, userId, isFocusTopicBox, currentMessage?.channel_id]
	);

	const firstFourElements = useMemo(() => {
		return emojiConverted.slice(0, 4);
	}, [emojiConverted]) as IEmoji[];

	const [warningStatus, setWarningStatus] = useState<string>('var(--bg-item-hover)');

	const className = {
		'--contexify-menu-bgColor': 'var(--bg-theme-contexify)',
		'--contexify-item-color': 'var(--text-theme-primary)',
		'--contexify-activeItem-color': 'var(--text-secondary)',
		'--contexify-activeItem-bgColor': warningStatus || 'var(--bg-item-hover)',
		'--contexify-rightSlot-color': 'var(--text-secondary)',
		'--contexify-activeRightSlot-color': 'var(--text-secondary)',
		'--contexify-arrow-color': 'var(--text-theme-primary)',
		'--contexify-activeArrow-color': 'var(--text-secondary)'
	} as React.CSSProperties;

	const { posShowMenu, onVisibilityChange } = useMessageContextMenu();
	const checkPos = useMemo(() => {
		if (posShowMenu === SHOW_POSITION.NONE || posShowMenu === SHOW_POSITION.IN_STICKER || posShowMenu === SHOW_POSITION.IN_EMOJI) {
			return true;
		}
		return false;
	}, [posShowMenu]);

	const children = useMemo(() => {
		const elements: React.ReactNode[] = [];
		for (let index = 0; index < items.length; index++) {
			const item = items[index];
			const lableItemWarning =
				item.label === 'Delete Message' ||
				item.label === 'Report Message' ||
				item.label === 'Remove Reactions' ||
				item.label === 'Remove All Reactions';
			if (item.label === 'Copy Link' && checkPos) elements.push(<Separator key={`separator-${index}`} />);
			if (item.label === 'Copy Image') elements.push(<Separator key={`separator-${index}`} />);
			const lableAddReaction = item.label === 'Add Reaction';

			if (lableAddReaction) {
				elements.push(
					<Dropdown
						key={item.label}
						trigger="hover"
						dismissOnClick={false}
						renderTrigger={() => (
							<div>
								<Item key={index} onClick={item.handleItemClick} disabled={item.disabled}>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											width: '100%',
											fontFamily: `'gg sans', 'Noto Sans', sans-serif`,
											fontSize: '14px',
											fontWeight: 500
										}}
										className={`${lableItemWarning ? ' text-[#E13542] hover:text-[#FFFFFF] ' : 'text-theme-primary text-theme-primary-hover'}  p-1`}
									>
										<span>Add Reaction</span>
									</div>
								</Item>
							</div>
						)}
						label=""
						placement="right-start"
						className=" border-none bg-theme-contexify"
					>
						{firstFourElements.map((item, index) => (
							<div className="w-[320px] " key={index}>
								<Item
									className="flex justify-between items-center w-full px-2 py-1"
									key={index}
									onClick={() => handleClickEmoji(item.id || '', item.shortname || '')}
								>
									<div
										className={`flex truncate justify-between items-center w-full font-sans text-sm font-medium ${lableItemWarning ? ' text-[#E13542] hover:text-[#FFFFFF] ' : 'text-theme-primary text-theme-primary-hover'}  p-1`}
									>
										{item.shortname}
									</div>
									<div className="p-1">
										<ReactionItem
											emojiShortCode={item.shortname || ''}
											emojiId={item.id || ''}
											messageId={messageId}
											isOption={false}
											isAddReactionPanel
											message={message}
											isTopic={isTopic}
										/>
									</div>
								</Item>
							</div>
						))}
						<hr className="border-b-theme-primary" />
						<Item className="w-full px-2 py-1" key={index} onClick={item.handleItemClick} disabled={item.disabled}>
							<div
								className={`class="flex justify-between items-center w-full font-sans text-sm font-medium ${lableItemWarning ? ' text-[#E13542] hover:text-[#FFFFFF] ' : 'text-theme-primary text-theme-primary-hover'}  p-1`}
							>
								<span>View More</span>
							</div>
						</Item>
					</Dropdown>
				);
			} else {
				elements.push(
					<Item
						key={item.label}
						onClick={item.handleItemClick}
						disabled={item.disabled}
						onMouseEnter={() => {
							if (lableItemWarning) {
								setWarningStatus('#E13542');
							} else {
								setWarningStatus('var(--bg-item-hover)');
							}
						}}
						onMouseLeave={() => {
							setWarningStatus('var(--bg-item-hover)');
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								width: '100%',
								fontFamily: `'gg sans', 'Noto Sans', sans-serif`,
								fontSize: '14px',
								fontWeight: 500
							}}
							className={`${lableItemWarning ? ' text-[#E13542] hover:text-[#FFFFFF] ' : 'text-theme-primary text-theme-primary-hover'}  p-1`}
						>
							<span>{item.label}</span>
							<span> {item.icon}</span>
						</div>
					</Item>
				);
			}

			if (item.hasSubmenu)
				elements.push(
					<Submenu label={item.label}>
						{item.subMenuItems?.map((subMenuItem) => (
							<Item key={subMenuItem.id} onClick={subMenuItem.handleItemClick} disabled={subMenuItem.disabled}>
								{subMenuItem.label}
							</Item>
						))}
					</Submenu>
				);
		}
		return elements;
	}, [items, checkPos, firstFourElements, messageId, handleClickEmoji]);

	return (
		<Menu
			onVisibilityChange={onVisibilityChange}
			id={menuId}
			style={className}
			className="z-50 rounded-lg  text-theme-primary text-theme-primary-hover border-theme-primary "
		>
			{checkPos && <ReactionPart emojiList={firstFourElements} messageId={messageId} isOption={false} message={message} isTopic={isTopic} />}
			{children}
		</Menu>
	);
}
